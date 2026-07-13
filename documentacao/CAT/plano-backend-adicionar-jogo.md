# Plano: Backend para adicionar/remover jogo da coleção do usuário

## Contexto

O plano de frontend ([plano-meus-jogos-e-adicionar-jogo.md](plano-meus-jogos-e-adicionar-jogo.md)) define três pontos que dependem do backend:

1. Botão "Quero jogar" na página de detalhes → `POST /games/want-to-play` com `{ gameId }`.
2. Modal de busca abre via box "Atividade recente" → mesmo `POST`.
3. Página `/my-games` → lista a coleção via `GET /games/collection` e remove via `DELETE /games/want-to-play/{gameId}`.

Hoje o endpoint [GET /games/collection](../backend/app/modules/games/api/controllers.py#L46-L50) existe mas retorna `items: []` fixo, e os endpoints de adicionar/remover não existem — o frontend foi escrito assumindo que retornariam erro até este plano ser executado.

O objetivo é implementar a persistência da coleção do usuário, mantendo a clean architecture do módulo `games` e reusando `GetGameDetailsUseCase` para garantir que cada jogo adicionado já esteja cacheado em `games` (assim `GET /collection` consegue devolver nome, capa, plataformas, etc.).

---

## Decisões de design

- **Schema simples**: tabela `user_games` com `(user_id, game_id, added_at)` e unique `(user_id, game_id)`. Sem `list_type` — quando "Minhas listas" for criado adicionamos uma coluna em migração futura.
- **Resolve & cache na adição**: `AddGameToCollection` chama `GetGameDetailsUseCase.execute(external_id)` internamente. Isso garante que a linha em `games` existe e o FK fica válido. Erros do provider (404, indisponível) propagam para HTTP 404/502.
- **Localização**: tudo dentro do módulo `games/` (extensão natural; reusa `GetGameDetailsUseCase` sem violar isolamento entre módulos).
- **Identificador externo**: o `gameId` no payload usa o mesmo formato `{external_source}-{external_id}` (ex.: `rawg-3328`) já em uso por `GET /games/{game_id}` — parsing centralizado em [_parse_external_id()](../backend/app/modules/games/infrastructure/sqlalchemy_repository.py#L36-L40), que deve ser movido para um helper compartilhado e reusado.

---

## 1. Camada de domínio

[backend/app/modules/games/domain/entities.py](../backend/app/modules/games/domain/entities.py) — adicionar:

```python
@dataclass
class UserGame:
    id: int
    user_id: int
    game_id: int            # FK interno para games.id
    external_id: str        # ex.: "rawg-3328" (derivado, para responses)
    name: str
    cover_url: str | None
    platforms: list[str]
    release_year: int | None
    added_at: datetime
```

[backend/app/modules/games/domain/repositories.py](../backend/app/modules/games/domain/repositories.py) — adicionar protocolo:

```python
class UserGameRepository(Protocol):
    def add(self, *, user_id: int, game_id: int) -> UserGame: ...
    def remove(self, *, user_id: int, game_id: int) -> bool: ...
    def list_by_user(self, user_id: int) -> list[UserGame]: ...
    def exists(self, *, user_id: int, game_id: int) -> bool: ...
    def find_internal_game_id(self, external_id: str) -> int | None: ...
```

`find_internal_game_id` traduz `"rawg-3328"` no `games.id` interno (necessário no use case de remover, que recebe external id pelo path).

[backend/app/modules/games/domain/exceptions.py](../backend/app/modules/games/domain/exceptions.py) — adicionar:

```python
class GameAlreadyInCollection(Exception): pass
class GameNotInCollection(Exception): pass
```

`GameNotFound` (já existe) é reusada quando a adição falha por external id inválido.

---

## 2. Camada de aplicação

Três novas use cases em [backend/app/modules/games/application/](../backend/app/modules/games/application/):

### `add_game_to_collection.py`

```python
class AddGameToCollectionUseCase:
    def __init__(
        self,
        details_use_case: GetGameDetailsUseCase,
        repository: UserGameRepository,
    ) -> None: ...

    def execute(self, *, user_id: int, external_id: str) -> UserGame:
        # 1. Garante que o jogo está cacheado em `games`. Pode lançar
        #    GameNotFound / GameProviderUnavailable — propaga.
        self._details_use_case.execute(external_id)
        internal_id = self._repository.find_internal_game_id(external_id)
        # internal_id sempre existe após execute() acima.
        if self._repository.exists(user_id=user_id, game_id=internal_id):
            raise GameAlreadyInCollection
        return self._repository.add(user_id=user_id, game_id=internal_id)
```

### `remove_game_from_collection.py`

```python
class RemoveGameFromCollectionUseCase:
    def __init__(self, repository: UserGameRepository) -> None: ...

    def execute(self, *, user_id: int, external_id: str) -> None:
        internal_id = self._repository.find_internal_game_id(external_id)
        if internal_id is None or not self._repository.remove(
            user_id=user_id, game_id=internal_id
        ):
            raise GameNotInCollection
```

### `get_user_collection.py`

```python
class GetUserCollectionUseCase:
    def __init__(self, repository: UserGameRepository) -> None: ...

    def execute(self, user_id: int) -> list[UserGame]:
        return self._repository.list_by_user(user_id)
```

---

## 3. Camada de infraestrutura

### Novo model `UserGameModel`

Arquivo: `backend/app/modules/games/infrastructure/user_game_model.py`

```python
class UserGameModel(Base):
    __tablename__ = "user_games"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="uq_user_games_user_game"),
        Index("ix_user_games_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    game_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("games.id", ondelete="CASCADE"), nullable=False
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
```

### Novo repositório SQLAlchemy

Arquivo: `backend/app/modules/games/infrastructure/sqlalchemy_user_game_repository.py`

Implementa `UserGameRepository`. Pontos-chave:

- `list_by_user`: `JOIN GameModel` para retornar nome, cover_url, plataformas, ano (derivado de `release_date.year`), ordenado por `added_at DESC`.
- `add`: insere, retorna entity já hidratada com dados do `games` JOIN (uma query a mais ou usar `joinedload`).
- `remove`: `DELETE ... WHERE user_id=? AND game_id=?` e retorna `bool(rowcount)`.
- `find_internal_game_id`: usa o helper de parsing `(external_source, external_id)` já existente em [sqlalchemy_repository.py:36](../backend/app/modules/games/infrastructure/sqlalchemy_repository.py#L36) — extrair para módulo compartilhado `infrastructure/external_id.py` e importar nos dois lugares.

### Migração Alembic

Arquivo: `backend/alembic/versions/<hash>_create_user_games_table.py`

```python
def upgrade() -> None:
    op.create_table(
        "user_games",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("game_id", sa.BigInteger(), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "game_id", name="uq_user_games_user_game"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_user_games_user_id", "user_games", ["user_id"])

def downgrade() -> None:
    op.drop_index("ix_user_games_user_id", table_name="user_games")
    op.drop_table("user_games")
```

`down_revision` deve apontar para `b2c3d4e5f6a7` (migração atual mais recente).

---

## 4. Camada de API

### Schemas

[backend/app/modules/games/api/schemas.py](../backend/app/modules/games/api/schemas.py) — adicionar:

```python
class AddToCollectionRequest(BaseModel):
    game_id: str = Field(..., alias="gameId", min_length=1)
    model_config = {"populate_by_name": True}
```

`CollectionGameResponse` já existe e tem o shape que o frontend espera — vai ser populado de verdade agora.

### Dependencies

[backend/app/modules/games/api/dependencies.py](../backend/app/modules/games/api/dependencies.py) — adicionar:

```python
def get_user_game_repository(
    session: Session = Depends(get_db),
) -> UserGameRepository: ...

def get_add_game_to_collection_use_case(
    details_uc: GetGameDetailsUseCase = Depends(get_game_details_use_case),
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> AddGameToCollectionUseCase: ...

def get_remove_game_from_collection_use_case(
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> RemoveGameFromCollectionUseCase: ...

def get_user_collection_use_case(
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> GetUserCollectionUseCase: ...
```

### Controllers

[backend/app/modules/games/api/controllers.py](../backend/app/modules/games/api/controllers.py) — três rotas:

```python
@router.post("/want-to-play", status_code=201,
             response_model=CollectionGameResponse, response_model_by_alias=True)
def add_to_collection(
    payload: AddToCollectionRequest,
    current_user: User = Depends(get_current_user),
    use_case: AddGameToCollectionUseCase = Depends(get_add_game_to_collection_use_case),
):
    try:
        item = use_case.execute(user_id=current_user.id, external_id=payload.game_id)
    except GameAlreadyInCollection:
        raise HTTPException(status_code=409, detail="Game already in collection")
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found")
    except GameProviderUnavailable:
        raise HTTPException(status_code=502, detail="Game provider unavailable")
    except GameProviderNotConfigured:
        raise HTTPException(status_code=503, detail="Game provider not configured")
    return _to_collection_response(item)


@router.delete("/want-to-play/{game_id}", status_code=204)
def remove_from_collection(
    game_id: str,
    current_user: User = Depends(get_current_user),
    use_case: RemoveGameFromCollectionUseCase = Depends(get_remove_game_from_collection_use_case),
):
    try:
        use_case.execute(user_id=current_user.id, external_id=game_id)
    except GameNotInCollection:
        raise HTTPException(status_code=404, detail="Game not in collection")
```

E substituir a implementação stub de `get_collection`:

```python
@router.get("/collection", response_model=CollectionResponse, response_model_by_alias=True)
def get_collection(
    current_user: User = Depends(get_current_user),
    use_case: GetUserCollectionUseCase = Depends(get_user_collection_use_case),
):
    items = use_case.execute(current_user.id)
    return CollectionResponse(items=[_to_collection_response(i) for i in items])
```

`_to_collection_response(user_game)` mapeia `UserGame` → `CollectionGameResponse` (mantém `id` da linha de coleção, `gameId` = `external_id`).

---

## 5. Testes

Seguindo o padrão de fakes em [tests/conftest.py](../backend/tests/conftest.py):

### Novo fake em `conftest.py`

```python
class FakeUserGameRepository:
    def __init__(self) -> None:
        self._rows: list[UserGame] = []
        self._next_id = 1
        # opcional: dict external_id -> internal_id para find_internal_game_id
        self.internal_ids: dict[str, int] = {}

    def add(self, *, user_id, game_id): ...
    def remove(self, *, user_id, game_id) -> bool: ...
    def list_by_user(self, user_id) -> list[UserGame]: ...
    def exists(self, *, user_id, game_id) -> bool: ...
    def find_internal_game_id(self, external_id) -> int | None:
        return self.internal_ids.get(external_id)
```

Adicionar fixture `fake_user_game_repo` e wire em `api_client` (override de `get_user_game_repository` + dos três novos use cases).

### Novos testes de use case

`backend/tests/modules/games/application/`:

- `test_add_game_to_collection.py` — caminhos: sucesso (inclui chamada a `GetGameDetailsUseCase`), `GameAlreadyInCollection`, propagação de `GameNotFound` do provider.
- `test_remove_game_from_collection.py` — sucesso e `GameNotInCollection`.
- `test_get_user_collection.py` — retorna lista ordenada, lista vazia.

### Novos testes de API

`backend/tests/modules/games/api/test_collection_routes.py`:

- `POST /games/want-to-play` autenticado: 201 + body, 409 já existe, 404 jogo inexistente, 401 sem cookie.
- `DELETE /games/want-to-play/{id}`: 204 sucesso, 404 não está na coleção, 401 sem cookie.
- `GET /games/collection`: retorna itens (popular fake), retorna lista vazia, 401 sem cookie.

---

## 6. Arquivos

### Novos
- `backend/app/modules/games/application/add_game_to_collection.py`
- `backend/app/modules/games/application/remove_game_from_collection.py`
- `backend/app/modules/games/application/get_user_collection.py`
- `backend/app/modules/games/infrastructure/user_game_model.py`
- `backend/app/modules/games/infrastructure/sqlalchemy_user_game_repository.py`
- `backend/app/modules/games/infrastructure/external_id.py` *(extrai `_parse_external_id`)*
- `backend/alembic/versions/<hash>_create_user_games_table.py`
- `backend/tests/modules/games/application/test_add_game_to_collection.py`
- `backend/tests/modules/games/application/test_remove_game_from_collection.py`
- `backend/tests/modules/games/application/test_get_user_collection.py`
- `backend/tests/modules/games/api/test_collection_routes.py`

### Modificados
- `backend/app/modules/games/domain/entities.py` — adiciona `UserGame`.
- `backend/app/modules/games/domain/repositories.py` — adiciona `UserGameRepository`.
- `backend/app/modules/games/domain/exceptions.py` — `GameAlreadyInCollection`, `GameNotInCollection`.
- `backend/app/modules/games/infrastructure/sqlalchemy_repository.py` — passa a importar `_parse_external_id` do helper.
- `backend/app/modules/games/api/schemas.py` — adiciona `AddToCollectionRequest`.
- `backend/app/modules/games/api/dependencies.py` — três novos provedores.
- `backend/app/modules/games/api/controllers.py` — duas rotas novas + `get_collection` real.
- `backend/tests/conftest.py` — `FakeUserGameRepository`, fixture, overrides.

---

## 7. Convenções respeitadas

- Clean architecture: nenhum import de fora para dentro; domain não conhece SQLAlchemy.
- Modular: tudo dentro de `games/`; `users` continua sendo só fonte de `get_current_user` (já era o padrão na controller atual).
- REST: POST cria (201), DELETE remove (204), GET lista (200), 409 para conflito, 404 quando recurso ausente.
- Naming em inglês; testes com fakes in-memory (sem integração).
- SQLAlchemy + Alembic; nenhum SQL cru.

---

## 8. Verificação

Comandos para rodar manualmente:

```bash
cd backend && source .venv/bin/activate

# 1. Aplicar migração
alembic upgrade head

# 2. Subir servidor
uvicorn app.main:app --reload

# 3. Testes
pytest tests/modules/games/application/
pytest tests/modules/games/api/test_collection_routes.py
pytest                                   # suite completa
```

Fluxo end-to-end (frontend + backend rodando):

1. Login → ir em `/game/rawg-3328` → clicar "Quero jogar" → `FeedbackModal` de sucesso; recarregar a página confirma estado `added=true` (a partir do `GET /collection`).
2. Voltar para `/` → filtro "Jogos adicionados" mostra o jogo no `CatalogCollection`.
3. Acessar `/my-games` → jogo aparece no grid com botão de remover; clicar remove → grid atualiza e `FeedbackModal` confirma.
4. Adicionar via modal (box vazio na home com filtro "Adicionados") → busca → clica resultado → sucesso → aparece na coleção.
5. Tentar adicionar o mesmo jogo duas vezes → frontend recebe 409 e mostra erro.

---

## 9. Sugestão de commit

`feat(collection): persist user game collection with add/remove/list endpoints`
