# CAT-02 — Backend: Página de Detalhes do Jogo

## Contexto

A história **CAT-02** introduz uma página de detalhes do jogo, acessada a partir de um resultado de busca ou (futuramente) de um item do catálogo pessoal do usuário. Hoje o backend tem apenas o endpoint `GET /games/search`, que consulta o RAWG ao vivo e devolve uma lista resumida (id, nome, capa, plataformas, ano). Precisamos de um novo endpoint que retorne **todas as informações relevantes** de um jogo específico, alinhado aos critérios da história:

- Capa, nome, descrição, data de lançamento
- Gêneros, plataformas, desenvolvedora
- **Duas notas**: `platformAverageRating` (dos usuários da plataforma — sempre `null` por enquanto, pois ainda não há módulo de avaliações) e `rawgRating` (vinda do RAWG; o frontend deixará explícita a origem de cada nota)
- Screenshots

**Decisões alinhadas:**
1. Exibir as duas notas, com `platformAverageRating: null` por ora.
2. **Cache local em PostgreSQL**: a primeira requisição busca no RAWG e persiste; chamadas seguintes leem do banco. Inclui migration Alembic.
3. Manter o prefixo do provider no id da URL: `GET /games/rawg-3498`.

---

## Escopo

**Dentro do escopo**
- Novo endpoint `GET /games/{game_id}` autenticado.
- Provider RAWG para detalhes (`/games/{id}` + `/games/{id}/screenshots`).
- Repositório SQLAlchemy + migration Alembic para a tabela `games` (cache).
- Use case `GetGameDetailsUseCase` com padrão **cache-aside**.
- Schemas Pydantic, dependency injection, testes unitários e de API.

**Fora do escopo (futuro)**
- Módulo de avaliações dos usuários da plataforma (campo `platformAverageRating` fica `null`).
- TTL/invalidação do cache (estrutura prevê coluna `cached_at`; lógica de expiração fica para depois).
- Normalização de gêneros/plataformas/devs em tabelas separadas (usaremos `JSON`; relacional pode entrar junto com a história de filtros).
- Endpoint de catálogo pessoal (outra história).
- Frontend (será planejado em seguida).

---

## Arquitetura — visão geral

Mesmo padrão Clean + Modular do módulo `games`. O use case orquestra repositório local (cache) e provider externo (RAWG):

```
Controller GET /games/{id}
    └─> GetGameDetailsUseCase
            ├─> GameRepository.find_by_id(id)         # cache hit?
            │       └─> retorna GameDetail e termina
            └─> GameDetailProvider.get_by_id(id)      # cache miss
                    ├─> RAWG /games/{rawg_id}
                    ├─> RAWG /games/{rawg_id}/screenshots
                    └─> GameRepository.save(detail)
                            └─> retorna GameDetail
```

Erros mapeados no controller (mesmo padrão de `search_games`):
- `GameNotFound` → **404**
- `GameProviderUnavailable` → **502**
- `GameProviderNotConfigured` → **503**

---

## Mudanças por camada

### 1. Domain — `backend/app/modules/games/domain/`

**`entities.py`** — adicionar dataclass:

```python
@dataclass
class GameDetail:
    id: str                       # ex.: "rawg-3498"
    name: str
    description: str | None       # texto plano
    release_date: date | None
    cover_url: str | None
    genres: list[str]
    platforms: list[str]
    developers: list[str]
    rawg_rating: float | None     # 0..5
    screenshots: list[str]
```

**`repositories.py`** — adicionar dois protocols:

```python
class GameDetailProvider(Protocol):
    def get_by_id(self, game_id: str) -> GameDetail: ...

class GameRepository(Protocol):
    def find_by_id(self, game_id: str) -> GameDetail | None: ...
    def save(self, detail: GameDetail) -> None: ...
```

**`exceptions.py`** — adicionar `GameNotFound`. Reutilizamos `GameProviderUnavailable` e `GameProviderNotConfigured` existentes.

### 2. Application — `backend/app/modules/games/application/`

**Novo `get_game_details.py`** — use case com cache-aside:

```python
class GetGameDetailsUseCase:
    def __init__(self, provider: GameDetailProvider, repository: GameRepository): ...

    def execute(self, game_id: str) -> GameDetail:
        cached = self.repository.find_by_id(game_id)
        if cached:
            return cached
        detail = self.provider.get_by_id(game_id)   # pode levantar GameNotFound
        self.repository.save(detail)
        return detail
```

Sem validação especial de tamanho de query (diferente do search). O id é validado pelo path param do FastAPI.

### 3. Infrastructure — `backend/app/modules/games/infrastructure/`

**`rawg_provider.py`** — adicionar `RawgGameDetailProvider` no mesmo arquivo (compartilha `_RAWG_BASE_URL`, padrão de erros e config `api_key`/`timeout_seconds` com a classe existente):

- Strip do prefixo `rawg-` → id numérico para chamar a API.
- Duas chamadas em sequência:
  1. `GET {base}/games/{rawg_id}?key=...`
  2. `GET {base}/games/{rawg_id}/screenshots?key=...&page_size=10`
- Mapeamento RAWG → `GameDetail`:
  - `description_raw` (texto puro; fallback para `description`)
  - `released` → `date` (parse tolerante com `datetime.strptime(..., "%Y-%m-%d").date()`)
  - `background_image` → `cover_url`
  - `genres[].name` → `genres`
  - `platforms[].platform.name` → `platforms` (mesma lógica já usada no search)
  - `developers[].name` → `developers`
  - `rating` → `rawg_rating`
  - screenshots: `results[].image` (cap em 10)
- Erros:
  - 404 do RAWG → `GameNotFound`
  - timeout / 5xx → `GameProviderUnavailable`
  - falha **apenas** em screenshots, mas a principal teve sucesso → retorna `GameDetail` com `screenshots=[]` (log apenas).

**Novo `sqlalchemy_repository.py`** — `GameModel` (SQLAlchemy) + `SqlAlchemyGameRepository`:

- Modelo segue o padrão dos modelos em `users/infrastructure/` e a [modelagem v1](modelagem-banco-v1.md#games).
- Colunas:
  - `id` (`BigInteger`, PK, autoincrement) — PK numérica interna, **não aparece na URL nem na resposta da API**.
  - `external_id` (`String(50)`, NOT NULL) — id na API externa (ex.: `"3498"`).
  - `external_source` (`String(20)`, NOT NULL) — `'rawg'` (futuro: `'igdb'`).
  - `name` (`String(500)`), `description` (`Text`), `release_date` (`Date`), `cover_url` (`Text`).
  - `genres` / `platforms` / `developers` / `screenshots` — todos `JSONB`, listas de string.
  - `rawg_rating` (`Float`).
  - `cached_at` (`DateTime(timezone=True)`, `server_default=func.now()`).
- Constraint: `UniqueConstraint('external_source', 'external_id', name='uq_games_external')`.
- Tradução entre id de API e PK interna fica encapsulada no repositório (helper privado `_parse_external_id(api_id: str) -> tuple[str, str]` que faz `split('-', 1)` e devolve `(external_source, external_id)`).
- `find_by_id(api_id: str)`: parseia `api_id` → `SELECT ... WHERE external_source = ? AND external_id = ?` → mapeia para `GameDetail` (com `GameDetail.id` reconstruído como `f"{external_source}-{external_id}"`).
- `save(detail: GameDetail)`: parseia `detail.id` → upsert via `INSERT ... ON CONFLICT (external_source, external_id) DO UPDATE` (dialect-specific; alternativa portátil: SELECT-then-INSERT/UPDATE). `session.merge` não funciona aqui porque a PK numérica não vem da entidade.

**Migration Alembic** — `backend/alembic/versions/<rev>_create_games_table.py`:
- `op.create_table("games", ...)` com as colunas acima, PK em `id` (BIGSERIAL) e `UniqueConstraint('external_source', 'external_id')`.

### 4. API — `backend/app/modules/games/api/`

**`controllers.py`** — novo endpoint no mesmo `router`:

```python
@router.get("/{game_id}", response_model=GameDetailResponse, response_model_by_alias=True)
def get_game_details(
    game_id: str,
    _current_user: User = Depends(get_current_user),
    use_case: GetGameDetailsUseCase = Depends(get_game_details_use_case),
):
    try:
        return use_case.execute(game_id)
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found")
    except GameProviderUnavailable:
        raise HTTPException(status_code=502, detail="Game provider unavailable")
    except GameProviderNotConfigured:
        raise HTTPException(status_code=503, detail="Game provider not configured")
```

> Atenção à ordem: `/search` precisa continuar declarado **antes** de `/{game_id}` no arquivo para FastAPI não casar `/search` com `{game_id}`. Hoje só existe `/search`, então basta declarar o novo endpoint depois dele.

**`schemas.py`** — adicionar:

```python
class GameDetailResponse(BaseModel):
    id: str
    name: str
    description: str | None
    release_date: date | None = Field(None, alias="releaseDate")
    cover_url: str | None     = Field(None, alias="coverUrl")
    genres: list[str]
    platforms: list[str]
    developers: list[str]
    platform_average_rating: float | None = Field(None, alias="platformAverageRating")  # sempre null por enquanto
    rawg_rating: float | None             = Field(None, alias="rawgRating")
    screenshots: list[str]
    model_config = {"populate_by_name": True, "from_attributes": True}
```

`platform_average_rating` permanece com default `None` no schema — não exige nada do domínio.

**`dependencies.py`** — adicionar três funções reaproveitando `get_settings` e a sessão do banco:

```python
def get_game_detail_provider(settings: Settings = Depends(get_settings)) -> GameDetailProvider:
    return RawgGameDetailProvider(api_key=settings.rawg_api_key)

def get_game_repository(session: Session = Depends(get_db_session)) -> GameRepository:
    return SqlAlchemyGameRepository(session)

def get_game_details_use_case(
    provider: GameDetailProvider = Depends(get_game_detail_provider),
    repository: GameRepository   = Depends(get_game_repository),
) -> GetGameDetailsUseCase:
    return GetGameDetailsUseCase(provider, repository)
```

Se `get_db_session` ainda não estiver exposto como dependency reutilizável, verificar o padrão usado em `users/api/dependencies.py` e seguir.

### 5. Configuração

Sem novas variáveis de ambiente. Reaproveita `settings.rawg_api_key`.

---

## Testes

Mesma estrutura existente em `backend/tests/modules/games/`:

- **`application/test_get_game_details.py`** — com `FakeProvider` e `FakeRepository` (in-memory dict):
  - cache miss → consulta provider, persiste e retorna.
  - cache hit → não consulta provider.
  - `GameNotFound` propagado.
- **`infrastructure/test_rawg_detail_provider.py`** — mock `requests.get` com `pytest-mock` (mesmo padrão do `test_rawg_provider.py`):
  - mapeamento happy path.
  - 404 → `GameNotFound`.
  - 5xx / timeout → `GameProviderUnavailable`.
  - falha apenas em screenshots → retorna detail com `screenshots=[]`.
  - `released` ausente / mal formatado → `release_date=None`.
- **`infrastructure/test_sqlalchemy_game_repository.py`** — usando o pattern de banco de teste já existente (`conftest.py`):
  - `find_by_id("rawg-3498")` retorna `None` quando vazio.
  - `save` + `find_by_id` round-trip preserva todos os campos (inclusive listas) e o `id` reconstruído bate com o original.
  - `save` em `(external_source, external_id)` existente faz upsert (não cria duplicata).
  - `_parse_external_id` rejeita ids sem prefixo (`"3498"`) ou com múltiplos hífens corretamente (split em 1).
- **`api/test_game_details_route.py`** — `TestClient` com overrides:
  - 401 sem auth.
  - 200 com payload em camelCase, `platformAverageRating: null`.
  - 404 quando provider levanta `GameNotFound`.
  - 502 / 503 nos respectivos erros.
  - cache hit não chama provider (provider fake com contador).

Atualizar `backend/tests/conftest.py` para registrar `FakeGameDetailProvider` e `FakeGameRepository`, espelhando o `FakeGameSearchProvider` existente.

---

## Verificação end-to-end

1. **Migration**
   ```bash
   cd backend && source .venv/bin/activate
   alembic upgrade head
   psql ... -c "\d games"     # confirma colunas
   ```

2. **Subir stack**
   ```bash
   docker-compose up -d
   uvicorn app.main:app --reload
   ```

3. **Fluxo feliz** (precisa estar autenticado — pegar cookie via `/auth/login`):
   ```bash
   curl -b cookies.txt http://localhost:8000/games/rawg-3498 | jq
   ```
   Esperado: JSON com `name`, `description`, `screenshots` (array), `platformAverageRating: null`, `rawgRating: <float>`.

4. **Cache hit**: repetir o curl — segunda chamada deve responder em < 50 ms e os logs **não** podem mostrar chamada ao RAWG.

5. **Not found**:
   ```bash
   curl -b cookies.txt -i http://localhost:8000/games/rawg-999999999
   ```
   Esperado: `HTTP/1.1 404`.

6. **Suite de testes**
   ```bash
   pytest backend/tests/modules/games -v
   ```

---

## Arquivos críticos (resumo)

| Camada | Caminho | Ação |
|---|---|---|
| Domain | `backend/app/modules/games/domain/entities.py` | adicionar `GameDetail` |
| Domain | `backend/app/modules/games/domain/repositories.py` | adicionar `GameDetailProvider`, `GameRepository` |
| Domain | `backend/app/modules/games/domain/exceptions.py` | adicionar `GameNotFound` |
| Application | `backend/app/modules/games/application/get_game_details.py` | novo |
| Infra | `backend/app/modules/games/infrastructure/rawg_provider.py` | adicionar `RawgGameDetailProvider` |
| Infra | `backend/app/modules/games/infrastructure/sqlalchemy_repository.py` | novo (`GameModel` + `SqlAlchemyGameRepository`) |
| Infra | `backend/alembic/versions/<rev>_create_games_table.py` | nova migration |
| API | `backend/app/modules/games/api/controllers.py` | adicionar `GET /{game_id}` |
| API | `backend/app/modules/games/api/schemas.py` | adicionar `GameDetailResponse` |
| API | `backend/app/modules/games/api/dependencies.py` | adicionar 3 deps |
| Tests | `backend/tests/modules/games/{application,infrastructure,api}/...` | 4 arquivos novos |
| Tests | `backend/tests/conftest.py` | adicionar fakes |

---

## Sugestão de commit (ao final da implementação)

`feat(games): add game details endpoint with rawg provider and postgres cache`
