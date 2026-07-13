# Plano Backend — INT-02: Escrever review sobre um jogo

## Contexto

Segunda história do épico de **interação**. O usuário quer escrever uma **review** (texto) sobre um
jogo para compartilhar sua opinião. Requisitos da história (Must have):

- Campo de texto com limite de **5000 caracteres**.
- Review **vinculada à nota** do jogo (convivem na mesma entrada da coleção).
- Possibilidade de **editar** e **excluir** a review.
- **Data de criação** visível.
- **Indicador de spoiler** (toggle booleano).

Decisões de produto confirmadas com o usuário:
1. **Independente + auto-add** — escrever review **não exige** nota. Se o jogo não estiver na coleção,
   gravar a review **auto-adiciona** a entrada e marca `status=finished` (espelha exatamente o INT-01
   de rating). Nota e review convivem na mesma linha `user_games`, ambas opcionais.
2. **Timestamps `created_at` + `updated_at`** — `review_created_at` é fixo (definido na primeira
   gravação, preservado nas edições); `review_updated_at` muda a cada edição (permite indicador
   "editado" no futuro).

A review é gravada na própria linha de `user_games` (1:1 com a entrada da coleção), espelhando o
padrão do rating (INT-01). Esta tarefa cobre **apenas o backend**; o frontend fica para outra história.

---

## Backend (`backend/app/modules/games/`)

### 1. Domínio

**`domain/entities.py`** — adicionar ao dataclass `UserGame` (após `rating`):
```python
review_text: str | None = None
review_is_spoiler: bool = False
review_created_at: datetime | None = None
review_updated_at: datetime | None = None
```
(`datetime` já está importado.)

**`domain/exceptions.py`** — adicionar `class InvalidReview(Exception): pass`.
Reusar `GameNotInCollection` para remoção quando o jogo não está na coleção (mesmo padrão do
`remove_rating`).

**`domain/repositories.py`** (`UserGameRepository` Protocol) — adicionar:
```python
def set_review(self, *, user_id: int, game_id: int, text: str, is_spoiler: bool) -> UserGame: ...
def clear_review(self, *, user_id: int, game_id: int) -> bool: ...
```

### 2. Infraestrutura

**`infrastructure/user_game_model.py`** — adicionar imports `Boolean, Text` e as colunas:
```python
review_text: Mapped[str | None] = mapped_column(Text, nullable=True)
review_is_spoiler: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
review_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
review_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

**`infrastructure/sqlalchemy_user_game_repository.py`**:
- `set_review` — busca a linha por `user_id`+`game_id`; `now = datetime.now(timezone.utc)`; se
  `review_created_at is None` define `review_created_at = now`; seta `review_text`,
  `review_is_spoiler`, `review_updated_at = now` e `status = OrmUserGameStatus.finished` (mesma
  semântica do `set_rating`); `flush`; retorna `_hydrate(row)`.
- `clear_review` — se `row is None` retorna `False`; senão zera os 4 campos de review
  (`review_text=None`, `review_is_spoiler=False`, `review_created_at=None`, `review_updated_at=None`),
  **mantém** `rating` e `status`; `flush`; retorna `True`. (Espelha `clear_rating`: idempotente,
  só falha quando o jogo não está na coleção.)
- `_hydrate` — incluir os 4 campos novos:
  ```python
  review_text=row.review_text,
  review_is_spoiler=bool(row.review_is_spoiler),
  review_created_at=row.review_created_at,
  review_updated_at=row.review_updated_at,
  ```
  (importar `datetime, timezone` no topo do arquivo para o `set_review`.)

**Migração** `backend/alembic/versions/f6a7b8c9d0e1_add_review_to_user_games.py`
(`down_revision = "e5f6a7b8c9d0"` — head atual do INT-01):
```python
def upgrade() -> None:
    op.add_column("user_games", sa.Column("review_text", sa.Text(), nullable=True))
    op.add_column("user_games", sa.Column("review_is_spoiler", sa.Boolean(),
                  nullable=False, server_default=sa.false()))
    op.add_column("user_games", sa.Column("review_created_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user_games", sa.Column("review_updated_at", sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column("user_games", "review_updated_at")
    op.drop_column("user_games", "review_created_at")
    op.drop_column("user_games", "review_is_spoiler")
    op.drop_column("user_games", "review_text")
```

### 3. Use cases (`application/`)

**`write_review.py` — `WriteReviewUseCase`** (espelha `rate_game.py`):
construtor `(details_use_case: GetGameDetailsUseCase, repository: UserGameRepository)`.
`execute(*, user_id, external_id, text, is_spoiler) -> UserGame`:
1. validar texto: `stripped = text.strip()`; se `not stripped or len(text) > 5000` → `raise InvalidReview`.
2. `details_use_case.execute(external_id)` (garante que o jogo existe / está em cache).
3. `internal_id = repo.find_internal_game_id(external_id)`.
4. se `not repo.exists(...)` → `repo.add(..., status=UserGameStatus.finished)`.
5. retornar `repo.set_review(user_id=..., game_id=internal_id, text=text, is_spoiler=is_spoiler)`.

**`remove_review.py` — `RemoveReviewUseCase`** (espelha `remove_rating.py`):
construtor `(repository)`. `execute(*, user_id, external_id) -> None`:
`internal_id = repo.find_internal_game_id(...)`; se `internal_id is None` ou
`not repo.clear_review(...)` → `raise GameNotInCollection`.

**`get_user_game_review.py` — `GetUserGameReviewUseCase`** (espelha `get_user_game_rating.py`):
construtor `(repository)`. `execute(*, user_id, external_id) -> UserGame | None`:
`internal_id`; se `None` → retorna `None`; `entry = repo.get(...)`; retorna `entry` se
`entry and entry.review_text is not None`, senão `None`. (Retorna a entidade para o controller montar
a resposta com texto/spoiler/timestamps.)

### 4. API (`api/`)

**`schemas.py`**:
```python
from datetime import date, datetime  # adicionar datetime

class WriteReviewRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    is_spoiler: bool = Field(False, alias="isSpoiler")
    model_config = {"populate_by_name": True}

class ReviewResponse(BaseModel):
    text: str
    is_spoiler: bool = Field(..., alias="isSpoiler")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    model_config = {"populate_by_name": True, "from_attributes": True}
```
- `GameDetailResponse` — adicionar `user_review: ReviewResponse | None = Field(None, alias="userReview")`.
- (Validação 422 automática pelo Pydantic; `InvalidReview` no use case é defesa em profundidade.)

**`dependencies.py`** — adicionar (mesma fiação `Depends` das existentes):
- `get_write_review_use_case` (injeta `get_game_details_use_case` + `get_user_game_repository`).
- `get_remove_review_use_case` (injeta `get_user_game_repository`).
- `get_user_game_review_use_case` (injeta `get_user_game_repository`).

**`controllers.py`**:
- Helper `_to_review_response(user_game: UserGame) -> ReviewResponse` montando text/isSpoiler/
  createdAt/updatedAt a partir dos campos `review_*`.
- `PUT /{game_id}/review` → 200, `response_model=ReviewResponse`, `response_model_by_alias=True`.
  Trata `InvalidReview`→422, `GameNotFound`→404, `GameProviderUnavailable`→502,
  `GameProviderNotConfigured`→503 (espelha o `PUT /{game_id}/rating`). Retorna `_to_review_response(item)`.
- `DELETE /{game_id}/review` → 204. Trata `GameNotInCollection`→404.
- `GET /{game_id}` — injetar `GetUserGameReviewUseCase`; após obter o detalhe, chamar
  `review_entry = review_use_case.execute(...)` e preencher
  `userReview=_to_review_response(review_entry) if review_entry else None`.
- **Ordem das rotas:** declarar `/{game_id}/review` (PUT/DELETE) **antes** de `GET /{game_id}`,
  junto das rotas de rating, para não colidir com a rota curinga.
- Atualizar imports (use cases, dependencies, `WriteReviewRequest`, `ReviewResponse`, `InvalidReview`).

### 5. Testes (`backend/tests/`)

**`tests/conftest.py`** — `FakeUserGameRepository`:
- `add` permanece igual (os campos de review têm default no dataclass).
- adicionar `set_review` (define `review_created_at` só na 1ª vez, seta texto/spoiler/`review_updated_at`,
  `status=finished`) e `clear_review` (zera os 4 campos, retorna `False` só quando a linha não existe).
- no `api_client`: criar `_get_write_review_use_case`, `_get_remove_review_use_case`,
  `_get_user_game_review_use_case` e registrar os 3 overrides (`get_write_review_use_case`,
  `get_remove_review_use_case`, `get_user_game_review_use_case`).

**`tests/modules/games/application/`**:
- `test_write_review.py` — sucesso (grava texto/spoiler/timestamps, `status=finished`); auto-add quando
  ausente; edição preserva `created_at` e altera `updated_at`; inválido (texto vazio e > 5000 chars) →
  `InvalidReview`.
- `test_remove_review.py` — sucesso (zera review, mantém rating/status); jogo desconhecido →
  `GameNotInCollection`; jogo fora da coleção → `GameNotInCollection`.
- `test_get_user_game_review.py` — retorna entry com review; `None` sem review; `None` fora da coleção;
  `None` quando `external_id` desconhecido.

**`tests/modules/games/api/test_review_routes.py`** (espelha `test_rating_routes.py`, reusa
`_login` e `_seed`):
- PUT feliz (200, retorna `text`/`isSpoiler`/`createdAt`/`updatedAt`).
- PUT com `isSpoiler=true` reflete no retorno.
- PUT texto vazio e PUT > 5000 chars → 422.
- PUT auto-add (`with_entry=False`) cria a entrada.
- DELETE feliz (204) e DELETE jogo fora da coleção → 404.
- `GET /games/{id}` retornando `userReview` preenchido e `null` quando não há review.

---

## Arquivos afetados (resumo)

Modificar: `domain/entities.py`, `domain/exceptions.py`, `domain/repositories.py`,
`infrastructure/user_game_model.py`, `infrastructure/sqlalchemy_user_game_repository.py`,
`api/schemas.py`, `api/dependencies.py`, `api/controllers.py`, `tests/conftest.py`.

Criar: `application/write_review.py`, `application/remove_review.py`,
`application/get_user_game_review.py`,
`alembic/versions/f6a7b8c9d0e1_add_review_to_user_games.py`,
`tests/modules/games/application/test_write_review.py`,
`tests/modules/games/application/test_remove_review.py`,
`tests/modules/games/application/test_get_user_game_review.py`,
`tests/modules/games/api/test_review_routes.py`.

---

## Verificação (comandos para o usuário rodar)

> O usuário roda build/testes/migração por conta própria.

```bash
cd backend && source .venv/bin/activate
alembic upgrade head     # aplica a migração de review
pytest                   # roda os novos testes + suíte
```

Checklist funcional esperado:
1. `PUT /games/{id}/review` em jogo não adicionado → 200, review com timestamps; jogo passa a existir
   na coleção com `status=finished`.
2. Editar a review (novo `PUT`) → `createdAt` permanece, `updatedAt` muda.
3. `GET /games/{id}` retorna `userReview` (text, isSpoiler, createdAt, updatedAt).
4. `DELETE /games/{id}/review` → 204; jogo permanece na coleção, nota intacta, `userReview` volta a `null`.
5. Texto vazio ou > 5000 caracteres → 422.

## Sugestão de commit
`feat(review): allow users to write, edit and delete game reviews`
