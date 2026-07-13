# Plano — Backend da Busca de Jogos (CAT-01)

## Context

A história **CAT-01** ("Como usuário, quero buscar jogos pelo nome para encontrar títulos específicos") já tem um plano de frontend em [plano-catalogo-busca-jogos.md](plano-catalogo-busca-jogos.md) que declara o endpoint `GET /games/search?q={termo}` como pré-requisito de backend. Hoje o backend só tem o módulo `users`; não existe nada relacionado a jogos.

Decisões confirmadas com o usuário:
- **Provedor externo:** RAWG (API key única; setup mais simples que IGDB).
- **Auth:** obrigatória via cookie `access_token` (reusa `get_current_user`).
- **Validação de query:** `q` vazia → 422; `q` com menos de 2 caracteres → 200 com `results: []` (sem chamar o provider). Reduz ruído e economiza cota.
- **Cache:** fora do escopo desta história.

Resultado pretendido: um novo módulo `modules/games/` (clean + modular) que expõe um endpoint REST autenticado de busca, com a integração RAWG isolada na camada de infraestrutura e testes em todas as camadas usando o mesmo padrão do módulo `users`.

## Contrato HTTP

`GET /games/search?q={termo}` — cookie `access_token` obrigatório.

**Sucesso (200):**
```json
{
  "results": [
    {
      "id": "rawg-3498",
      "name": "Grand Theft Auto V",
      "coverUrl": "https://media.rawg.io/.../cover.jpg",
      "platforms": ["PlayStation 5", "PC"],
      "releaseYear": 2013
    }
  ]
}
```
`coverUrl` e `releaseYear` podem ser `null`. `platforms` é sempre array (pode ser `[]`).

**Erros:**
- `401` — sem cookie ou cookie inválido (já tratado por `get_current_user`).
- `422` — `q` ausente/vazio (validação Pydantic `min_length=1`).
- `502` — `GameProviderUnavailable` (timeout/erro de rede/HTTP 5xx da RAWG).
- `503` — provider configurado sem API key.

## Arquivos

Mantém o padrão observado em [backend/app/modules/users/](../backend/app/modules/users/) — camadas `domain/`, `application/`, `api/`, `infrastructure/` (o projeto usa `application/` e `api/` em vez dos nomes `use_cases/`/`interfaces/` citados no CLAUDE.md; segue-se a convenção real do código).

### Novos

- `backend/app/modules/games/__init__.py`
- `backend/app/modules/games/domain/__init__.py`
- `backend/app/modules/games/domain/entities.py`
  - `@dataclass GameSearchResult`: `id: str`, `name: str`, `cover_url: str | None`, `platforms: list[str]`, `release_year: int | None`.
- `backend/app/modules/games/domain/repositories.py`
  - `class GameSearchProvider(Protocol)`: `search(self, query: str) -> list[GameSearchResult]`. Mesmo estilo de Protocol usado em [backend/app/modules/users/domain/repositories.py](../backend/app/modules/users/domain/repositories.py).
- `backend/app/modules/games/domain/exceptions.py`
  - `GameProviderUnavailable` e `GameProviderNotConfigured`. Espelha o padrão de [backend/app/modules/users/domain/exceptions.py](../backend/app/modules/users/domain/exceptions.py).
- `backend/app/modules/games/application/__init__.py`
- `backend/app/modules/games/application/search_games.py`
  - `class SearchGamesUseCase`. Recebe `provider: GameSearchProvider`. `execute(query: str) -> list[GameSearchResult]`. Lógica:
    - `query = query.strip()`
    - Se `len(query) < 2`: retorna `[]` (curto-circuito sem chamar provider).
    - Caso contrário: `return self._provider.search(query)`.
- `backend/app/modules/games/infrastructure/__init__.py`
- `backend/app/modules/games/infrastructure/rawg_provider.py`
  - `class RawgGameSearchProvider(GameSearchProvider)`. Construtor recebe `api_key: str` e `timeout_seconds: float = 5.0`. Se `api_key` vazia, levanta `GameProviderNotConfigured` em `__init__`.
  - `search(query)`: usa `requests.get("https://api.rawg.io/api/games", params={"key": api_key, "search": query, "page_size": 20}, timeout=timeout_seconds)`. Em `Timeout`/`ConnectionError`/`HTTPError 5xx` → `GameProviderUnavailable`. `response.raise_for_status()` antes do parse.
  - Mapeia `results[]` para `GameSearchResult`:
    - `id = f"rawg-{item['id']}"`
    - `name = item['name']`
    - `cover_url = item.get('background_image')` (pode ser `None`)
    - `platforms = [p['platform']['name'] for p in (item.get('platforms') or [])]`
    - `release_year = int(item['released'][:4])` se `item.get('released')` válido, senão `None`.
- `backend/app/modules/games/api/__init__.py`
- `backend/app/modules/games/api/schemas.py`
  - `class GameSearchResultResponse(BaseModel)`: campos `id`, `name`, `cover_url`, `platforms`, `release_year` com `alias` (`coverUrl`, `releaseYear`) via `Field(..., alias=...)` e `model_config = {"populate_by_name": True, "from_attributes": True}` para serializar em camelCase como o frontend espera.
  - `class GameSearchResponse(BaseModel)`: `results: list[GameSearchResultResponse]`.
- `backend/app/modules/games/api/dependencies.py`
  - `get_game_search_provider(settings) -> GameSearchProvider`: instancia `RawgGameSearchProvider(settings.rawg_api_key)`.
  - `get_search_games_use_case(provider) -> SearchGamesUseCase`.
- `backend/app/modules/games/api/controllers.py`
  - `router = APIRouter(prefix="/games", tags=["games"])`.
  - `@router.get("/search", response_model=GameSearchResponse, response_model_by_alias=True)` recebe `q: str = Query(..., min_length=1)`, depende de `get_current_user` (auth) e `get_search_games_use_case`. Try/except converte `GameProviderUnavailable` → `HTTPException(502)` e `GameProviderNotConfigured` → `HTTPException(503)`.

### Testes (espelham a estrutura em [backend/tests/modules/users/](../backend/tests/modules/users/))

- `backend/tests/modules/games/__init__.py`
- `backend/tests/modules/games/application/test_search_games.py`
  - `query` em branco → `[]` sem chamar o provider.
  - `query` com 1 char → `[]` sem chamar o provider.
  - `query` válida → repassa para `provider.search` e retorna o resultado.
  - Strip de espaços (`" "` ainda é vazio).
- `backend/tests/modules/games/infrastructure/test_rawg_provider.py`
  - Usa `pytest-mock` (já em [backend/requirements.txt](../backend/requirements.txt)) para mockar `requests.get`.
  - Mapeamento RAWG → `GameSearchResult` (incluindo `released` ausente/`None`, `platforms` ausente, `background_image` `None`).
  - `Timeout`/`ConnectionError` → `GameProviderUnavailable`.
  - Status 500 → `GameProviderUnavailable`.
  - `__init__` com `api_key=""` → `GameProviderNotConfigured`.
- `backend/tests/modules/games/api/test_games_routes.py`
  - `api_client` com override de provider fake (lista de `GameSearchResult` controlada por teste).
  - `GET /games/search?q=gta` sem cookie → 401.
  - `GET /games/search?q=gta` autenticado → 200 com payload camelCase (`coverUrl`, `releaseYear`).
  - `GET /games/search?q=` → 422.
  - `GET /games/search?q=a` (1 char) autenticado → 200 com `results: []` (use case curto-circuita).
  - Provider levanta `GameProviderUnavailable` → 502.

### Modificados

- [backend/app/main.py](../backend/app/main.py): `from app.modules.games.api.controllers import router as games_router` + `app.include_router(games_router)`.
- [backend/app/core/config.py](../backend/app/core/config.py): adicionar `rawg_api_key: str = ""` em `Settings`. Default vazio mantém compatibilidade com dev/test; o provider falha rápido com `GameProviderNotConfigured` (HTTP 503) se for usado sem chave.
- [backend/tests/conftest.py](../backend/tests/conftest.py):
  - Estender `_TEST_SETTINGS` com `rawg_api_key="test-rawg-key"`.
  - Adicionar fixture `fake_game_search_provider` (lista in-memory de `GameSearchResult` + flag para forçar `GameProviderUnavailable`).
  - Em `api_client`, registrar overrides para `get_game_search_provider` e `get_search_games_use_case`.
- `.env`: adicionar `RAWG_API_KEY=` (vazio por padrão; usuário preenche localmente — não criar `.env.example`, seguindo a convenção do projeto).

## Configuração e operação

- O usuário precisa obter uma API key em `https://rawg.io/apidocs` e setar `RAWG_API_KEY` no `.env`.
- Sem chave, o endpoint responde 503 — ajuda no diagnóstico em vez de quebrar silenciosamente.
- Sem cache: cada request bate na RAWG. O frontend já tem debounce 300ms + `AbortController`, então o tráfego real fica controlado. Reavaliar se cota virar gargalo.

## Verificação

Comandos para rodar manualmente após a implementação:

```bash
cd backend
source .venv/bin/activate
pytest                                  # toda a suíte verde
pytest tests/modules/games -v           # foco no novo módulo
uvicorn app.main:app --reload           # subir o servidor

# Manual (precisa de um cookie de auth válido obtido via /auth/login):
curl -i -b "access_token=<token>" "http://localhost:8000/games/search?q=zelda"
# 200 com { "results": [...] } em camelCase
curl -i "http://localhost:8000/games/search?q=zelda"
# 401 (sem cookie)
curl -i -b "access_token=<token>" "http://localhost:8000/games/search?q="
# 422
curl -i -b "access_token=<token>" "http://localhost:8000/games/search?q=a"
# 200 com results: []
```

Integração com o frontend: após concluir o backend e o frontend (plano paralelo), abrir [http://localhost:5173](http://localhost:5173), logar, digitar no header → dropdown popula com dados reais da RAWG.

## Commit sugerido

`feat(games): add game search endpoint backed by rawg provider`
