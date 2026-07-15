# Plano (fullstack): Adicionar e remover jogos das listas

## Context

**História:** Como usuário, quero adicionar e remover jogos das minhas listas.

Esta história quita o débito técnico registrado na história anterior (CRUD de listas): a **associação lista↔jogo** (tabela `game_list_items`) e a **aplicação efetiva do `MAX_GAMES_PER_LIST = 50`** — hoje o limite existe só como constante de domínio comentada.

**Critérios de aceitação:**
- Botão "Adicionar à lista" na página do jogo, abrindo um seletor com as listas do usuário.
- Item "Adicionar à lista" do menu do card em Meus Jogos (hoje `<MenuItem disabled>`) funcional, exibindo as listas disponíveis.
- Indicador de que o jogo já está na lista ao tentar adicioná-lo de novo (marcado/desabilitado no seletor + 409 no backend).
- Remover jogo de dentro da lista (página de detalhe `/my-lists/:id`).

**Decisões confirmadas com o usuário:**
- **Capas reais nos 5 poster slots** do `ListCard` entram nesta história — o `GET /lists` passa a retornar as capas dos 5 jogos mais recentes de cada lista.
- **Listas independentes da coleção**: qualquer jogo pode entrar numa lista, esteja ou não em Meus Jogos. O backend garante o registro do jogo na tabela `games` via `GetGameDetailsUseCase` (mesmo fluxo do `add_game_to_collection`).

**Resultado esperado:** usuário autenticado adiciona jogos às suas listas (pela página do jogo e pelo menu em Meus Jogos), vê quais listas já contêm o jogo, remove jogos de dentro da lista, e vê as capas dos jogos no card da lista — tudo persistido e escopado por usuário.

## Padrões existentes a reutilizar

Referências (caminhos a partir da raiz `gametracker/`):
- **Fluxo de garantir jogo na base + resolver id interno:** `backend/app/modules/games/application/add_game_to_collection.py` (usa `GetGameDetailsUseCase` + `UserGameRepository.find_internal_game_id`), `backend/app/modules/games/application/get_game_details.py` (cache-or-fetch-and-save), `backend/app/modules/games/infrastructure/external_id.py` (parse `"rawg-3328"`).
- **Model + repo + hidratação:** `backend/app/modules/games/infrastructure/sqlalchemy_repository.py` (`GameModel`), `backend/app/modules/games/infrastructure/sqlalchemy_user_game_repository.py` (`_hydrate` com join em `GameModel`, `release_year` de `release_date`).
- **Módulo game_lists (base desta história):** `backend/app/modules/game_lists/` — domain/application/infrastructure/api já existentes do CRUD.
- **Schema com dados do jogo:** `CollectionGameResponse` em `backend/app/modules/games/api/schemas.py` (aliases camelCase).
- **Mapeamento de erros de provider:** controller de `games` (`GameNotFound`→404, `GameProviderUnavailable`→502, `GameProviderNotConfigured`→503, `InvalidRating`→422).
- **Migration head atual:** `backend/alembic/versions/b8c9d0e1f2a3_create_game_lists_table.py`.
- **Testes:** fakes em `backend/tests/conftest.py` (`FakeGameListRepository`, `FakeUserGameRepository` com dict `internal_ids`, `FakeGameDetailProvider`, `FakeGameRepository`) + fixture `api_client` com `dependency_overrides`; rotas em `backend/tests/modules/game_lists/api/test_game_lists_routes.py`.

Frontend (atomic design):
- **Modal seletor:** `frontend/src/components/organisms/AddGameModal/AddGameModal.tsx` (Dialog + FeedbackModal próprio + callback).
- **Menu do card:** `frontend/src/components/molecules/GameCardMenu/GameCardMenu.tsx` (MUI Menu, `stopEvent`, dialog secundário; item `menuAddToList` hoje `disabled`).
- **Botão de ação na página do jogo:** `frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.tsx` ("Quero jogar" com `addLoading`/`added`).
- **Grid/página modelo:** `MyGamesGrid`/`MyGamesPage` (handlers async + `FeedbackModal` no nível da página).
- **Detalhe da lista:** `frontend/src/components/pages/MyListDetailPage/MyListDetailPage.tsx` (hoje `getLists()+find`).
- **Card com poster slots:** `frontend/src/components/molecules/ListCard/ListCard.tsx` (5 `PosterSlot` placeholders).
- Serviços sobre `frontend/src/services/http.ts`; textos em `frontend/src/constants/texts.ts`; cores em `frontend/src/theme/colors.ts`.

---

## Decisão arquitetural: acoplamento `game_lists` ↔ `games`

O CLAUDE.md proíbe import direto entre módulos, mas a feature precisa do catálogo de jogos. **Abordagem: ports no domínio + adaptadores nas camadas externas** (exceção pragmática documentada):

- `game_lists/domain` define o port **`GameCatalog`** (Protocol): `ensure_game(external_id) -> int` (garante registro na tabela `games` e retorna id interno) e `resolve_game_id(external_id) -> int | None` (só resolve, sem fetch externo). Domain e application ficam 100% desacoplados de `games`.
- Adaptador **`GamesCatalogAdapter`** em `game_lists/infrastructure/games_catalog_adapter.py` compõe `GetGameDetailsUseCase` + `UserGameRepository.find_internal_game_id` (fluxo idêntico ao `add_game_to_collection`).
- O repositório de itens faz **join direto com `GameModel`** para hidratar nome/capa/plataformas (leitura infra-a-infra, análoga ao `_hydrate` do `SqlAlchemyUserGameRepository`).
- O **wiring** acontece em `game_lists/api/dependencies.py`, reutilizando os providers de `games/api/dependencies.py` (padrão que o `conftest` já segue). O controller captura as exceções de `games`.
- **Registrar a exceção** com comentário curto no adaptador e no repo de itens: *"cross-module import permitido apenas em infrastructure/api (composition edges); domain/application dependem só de ports."*

*Alternativa rejeitada:* portar também a leitura da tabela `games` para dentro de `game_lists` — geraria N+1 de chamadas e duplicação de hidratação/schema sem benefício real.

## Decisão: indicador "já está na lista"

**`GET /lists?gameId=rawg-3328`** — parâmetro opcional que anexa `containsGame: boolean` a cada lista. **Um único request** popula o seletor inteiro (nomes + contagem + flag). Sem `gameId`, o campo vem `null`. Se o jogo nunca foi registrado na tabela `games`, `containsGame` é `false` para todas (usa só `resolve_game_id`, sem fetch no provider). O `POST` continua retornando **409** como defesa contra estado obsoleto/corrida; o frontend trata o 409 com mensagem própria.

## Contratos de API

| Método | Path | Request | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/lists?gameId={ext?}` | — | 200 `GameListsResponse` (itens + `gameCount`, `coverUrls`, `containsGame?`) | 401 |
| GET | `/lists/{list_id}` | — | 200 `GameListDetailResponse` | 401, 404 lista |
| POST | `/lists/{list_id}/games` | `{"gameId": "rawg-3328"}` | 201 `ListGameResponse` | 401; 404 lista ou jogo; **409** já na lista; **422** lista cheia (50); 502/503 provider |
| DELETE | `/lists/{list_id}/games/{game_id}` (external id) | — | 204 | 401; 404 lista ou jogo fora da lista |

**Shapes** (aliases camelCase, `model_config = {"populate_by_name": True, "from_attributes": True}`):
- `GameListResponse` **estendido**: + `game_count`→`gameCount` (int), `cover_urls`→`coverUrls` (list[str], ≤5, mais recentes primeiro), `contains_game`→`containsGame` (`bool | None`, default `None`).
- `ListGameResponse`: `gameId` (str external), `name`, `coverUrl` (str|None), `platforms` (list[str]), `releaseYear` (int|None), `addedAt` (datetime) — espelha `CollectionGameResponse`.
- `GameListDetailResponse`: campos da lista + `items: list[ListGameResponse]`.
- `AddGameToListRequest`: `game_id` (str, alias `gameId`, min_length=1).

O 422 de lista cheia segue o padrão da casa (`InvalidRating` → 422 no controller de games).

---

## Backend — módulo `app/modules/game_lists/`

### domain/
- **entities.py** — dataclasses `ListedGame(game_id: str /*external*/, name, cover_url, platforms, release_year, added_at)` e `GameListPreview(game_list: GameList, game_count: int, cover_urls: list[str], contains_game: bool | None = None)`. Atualizar o comentário do `MAX_GAMES_PER_LIST` (o limite passa a ser aplicado).
- **exceptions.py** — `GameAlreadyInList`, `GameListFull`, `GameNotInList`.
- **repositories.py** — Protocols novos:
  - `GameListItemRepository`: `add(*, list_id, game_id) -> ListedGame` (retorna hidratado via join), `remove(*, list_id, game_id) -> bool`, `exists(*, list_id, game_id) -> bool`, `count(list_id) -> int`, `list_games(list_id) -> list[ListedGame]` (added_at desc), `counts_by_list(list_ids) -> dict[int, int]`, `recent_covers(list_ids, *, limit=5) -> dict[int, list[str]]`, `list_ids_containing(*, list_ids, game_id) -> set[int]`.
  - `GameCatalog`: `ensure_game(external_id) -> int`, `resolve_game_id(external_id) -> int | None`.

### application/ (um arquivo por use case, `execute(...)` keyword-only)
- **add_game_to_list.py** — `AddGameToListUseCase(list_repository, item_repository, game_catalog)`: lista não é do user → `GameListNotFound`; `ensure_game` (exceções de provider/jogo propagam); `exists` → `GameAlreadyInList`; `count >= MAX_GAMES_PER_LIST` → `GameListFull`; `add` → `ListedGame`.
- **remove_game_from_list.py** — `RemoveGameFromListUseCase(list_repository, item_repository, game_catalog)`: lista → 404; `resolve_game_id` None ou `remove` False → `GameNotInList`.
- **get_list_games.py** — `GetListGamesUseCase(list_repository, item_repository)` → `(GameList, list[ListedGame])`; lista → 404.
- **get_user_lists.py (alterado)** — `GetUserListsUseCase(repository, item_repository, game_catalog)`, `execute(user_id, *, contains_external_id=None) -> list[GameListPreview]`: `counts_by_list` + `recent_covers(limit=5)` em lote (sem N+1); flag via `resolve_game_id` + `list_ids_containing` quando `gameId` presente.

### infrastructure/
- **game_list_item_model.py** — `GameListItemModel(Base)`, tabela `game_list_items`: `id` BigInteger PK; `list_id` FK→`game_lists.id` CASCADE not null; `game_id` FK→`games.id` CASCADE not null; `added_at` DateTime(tz) default now. `UniqueConstraint("list_id","game_id", name="uq_game_list_items_list_game")` + `Index("ix_game_list_items_list_id", "list_id")`.
- **sqlalchemy_game_list_item_repository.py** — implementa o Protocol; join com `GameModel` para hidratar `ListedGame` (`game_id = f"{external_source}-{external_id}"`, `release_year` de `release_date`); `recent_covers` com 1 query `IN` + agrupamento em Python; `counts_by_list` com `group_by` + `func.count`.
- **games_catalog_adapter.py** — `GamesCatalogAdapter(details_use_case, user_game_repository)`.

### Migration
- Nova revisão `create_game_list_items_table`, `down_revision = "b8c9d0e1f2a3"`. `upgrade()` cria a tabela (FKs CASCADE, `added_at` `server_default=sa.func.now()`, unique + index); `downgrade()` faz drop de ambos. Formato de `b8c9d0e1f2a3_create_game_lists_table.py`.

### api/
- **schemas.py** — estender `GameListResponse`; criar `ListGameResponse`, `GameListDetailResponse`, `AddGameToListRequest`.
- **dependencies.py** — `get_game_list_item_repository`, `get_game_catalog` (compõe `get_game_details_use_case` + `get_user_game_repository` de games), providers dos 3 use cases novos, atualizar `get_user_lists_use_case`.
- **controllers.py** — `GET /lists` ganha `game_id: str | None = Query(None, alias="gameId")`; novas rotas `GET /lists/{list_id}`, `POST /lists/{list_id}/games`, `DELETE /lists/{list_id}/games/{game_id}`; mapeamento de erros (mensagens iguais às do controller de games para provider/jogo).

### Testes (backend)
- `conftest.py`: `FakeGameListItemRepository`; catálogo fake **compondo `GamesCatalogAdapter` real sobre `FakeGameDetailProvider` + `FakeUserGameRepository`** (reusa fakes existentes); fixtures + overrides novos; atualizar override de `get_user_lists_use_case`.
- `tests/modules/game_lists/api/test_game_list_items_routes.py`: POST 201 camelCase; 409 duplicado; 422 na 51ª; 404 lista de outro usuário / jogo desconhecido; DELETE 204/404; `GET /lists/{id}` 200+404; `GET /lists?gameId=` flags true/false; `coverUrls`/`gameCount` no `GET /lists`; 401 em todas.
- Testes unitários de aplicação (fakes em memória): limite 50, duplicado, escopo por usuário, ordenação.
- Atualizar asserts de `test_game_lists_routes.py` afetados pelos campos novos.

---

## Frontend

### types
- `src/types/list.ts` — `GameList` + `gameCount: number`, `coverUrls: string[]`, `containsGame?: boolean | null`; novos `ListGame { gameId; name; coverUrl: string | null; platforms: string[]; releaseYear: number | null; addedAt: string }` e `GameListDetail` (lista + `items: ListGame[]`).

### service
- `src/services/lists.ts` — `getLists(gameId?)` (anexa `?gameId=`), `getList(id)`, `addGameToList(listId, gameId)`, `removeGameFromList(listId, gameId)`. Erros seguem o padrão: `http` lança o `Response` cru; chamador testa `err instanceof Response && err.status === 409/422`.

### textos
- `src/constants/texts.ts` — novo bloco `addToList` (título do dialog, `loadError`, empty + CTA "Criar lista", labels "Já está nesta lista"/"Lista cheia", contagem, mensagens sucesso/erro/409/422, `closeButton`); `gameDetails.addToListButton`; `myLists.removeGame*` (aria/sucesso/erro); **atualizar** `myLists.detailGamesEmptyDescription` (não é mais "em breve").

### componentes (atomic design — MUI + styled-components, cores via tokens, textos via texts.ts)
- **organism `AddToListDialog`** (novo, reutilizável — padrão `AddGameModal`): props `{ open, gameId, onClose, onAdded? }`. Ao abrir: `getLists(gameId)`; estados loading/erro/vazio (`EmptyState` + CTA para `/my-lists`). Lista MUI (`List`/`ListItemButton`): nome + contagem; `CheckIcon` + disabled quando `containsGame`; disabled quando `gameCount >= 50`. Clique → `addGameToList` → sucesso atualiza item local e chama `onAdded`; catch 409 → mensagem própria (marca item), 422 → "lista cheia". `stopEvent` no Dialog (uso dentro de cards com `Link`).
- **`GameCardMenu`** — prop `onAddToList?: () => void`; MenuItem deixa de ser `disabled` quando a prop existe. Encadear por `GameCard` → `MyGamesGrid` → `MyGamesPage`, que guarda `addToListGameId: string | null` e renderiza **um único** `AddToListDialog` no nível da página.
- **`GameDetailsHeader`** — prop `onAddToList`; segundo botão (`variant="outlined"`, `PlaylistAddIcon`, `gameDetails.addToListButton`) ao lado de "Quero jogar"; `GameDetailsPage` controla `addToListOpen` e renderiza o dialog.
- **`ListCard`** — `PosterRow` renderiza `list.coverUrls.slice(0,5)` como `<img>` (`object-fit: cover`, `alt=""` decorativo) + `PosterSlot` placeholders para os vazios.
- **`MyListDetailPage`** — trocar `getLists()+find` por `getList(id)` (404 → not-found); novo molecule **`ListGameCard`** (variação enxuta do `GameCard` para `ListGame`: link para `/games/:id`, capa, nome, meta, `IconButton` remover com stopPropagation — *decisão: não reutilizar `GameCard`*, que exige `CollectionGame` e arrasta o menu) + organism **`ListGamesGrid`** (empty state + grid); `handleRemove` → `removeGameFromList` + filtro local + `FeedbackModal`.

### testes (frontend)
Escrever/revisar com a skill `/test-skill`; todo componente novo com ao menos um teste; `vi.mock` de `services/lists`, providers de tema, `MemoryRouter` onde há `Link`.
- `AddToListDialog.test.tsx` (flags/disabled, clique chama service, 409, empty), `ListGameCard.test.tsx`, `ListGamesGrid.test.tsx`, `GameCardMenu.test.tsx` (item habilitado/desabilitado), `GameDetailsHeader.test.tsx` (novo botão), `MyListDetailPage.test.tsx` (getList, remoção, 404), `ListCard.test.tsx` (capas + placeholders).
- **Atualizar mocks existentes** que quebram com `gameCount`/`coverUrls` (`MyListsPage.test`, `MyListsGrid.test`, `ListCard.test`, `MyListDetailPage.test`).

---

## Verificação

**Backend**
- `cd gametracker/backend && source .venv/bin/activate && pytest` — todos os testes verdes.
- `alembic upgrade head` aplica a migration; `alembic downgrade -1` reverte limpo (contra o Postgres do `docker-compose.yml`).
- Smoke manual (autenticado): `POST /lists/{id}/games` `{ "gameId": "rawg-3328" }` → 201; repetir → 409; `GET /lists?gameId=rawg-3328` → `containsGame: true` na lista; `GET /lists/{id}` retorna `items`; `DELETE /lists/{id}/games/rawg-3328` → 204; sem cookie → 401.

**Frontend**
- `cd gametracker/frontend && npm test && npm run build && npm run lint` — verdes.
- `npm run dev` + backend: (1) página do jogo → "Adicionar à lista" → seletor → adicionar → reabrir e ver check/disabled; (2) mesmo fluxo pelo menu de um card em Meus Jogos; (3) capas aparecem no `ListCard` em `/my-lists`; (4) abrir a lista, remover um jogo, confirmar persistência após reload.

**End-to-end**: subir via `docker-compose.yml`, logar e exercitar adicionar (2 entradas) → indicador → limite 50 (422) → remover.

**Fechamento**: sugerir mensagem de commit `feat(lists): add and remove games from custom lists` (Conventional Commits).

## Riscos e trade-offs
1. **Acoplamento game_lists↔games** contido em 3 pontos externos (adaptador infra, join no repo, wiring api) com ports puros no domínio — extração futura troca só adaptadores.
2. **Campos novos obrigatórios no GET /lists** quebram mocks existentes (custo assumido) em troca de seletor + capas em **1 request**; +2 queries em lote, sem N+1.
3. **Flag do seletor** pode ficar obsoleta (outra aba) — 409 do backend é a fonte de verdade; unique constraint blinda corrida.
4. **Limite 50 checado na aplicação** (corrida pode gerar 51 em requests simultâneos — aceitável); duplicata é blindada pela constraint.
5. **`ensure_game` pode chamar o provider RAWG** no POST (jogo nunca visto) → herda 502/503 já mapeados do fluxo want-to-play.

## Fora de escopo (histórias futuras)
- Reordenar jogos na lista; toggle público/privado na UI; listas públicas / compartilhamento.
