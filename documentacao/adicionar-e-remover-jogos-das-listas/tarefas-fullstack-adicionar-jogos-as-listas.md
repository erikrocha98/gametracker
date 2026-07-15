# Tarefas (fullstack): Adicionar e remover jogos das listas

Quebra do [plano-fullstack-adicionar-jogos-as-listas.md](plano-fullstack-adicionar-jogos-as-listas.md) em tarefas implementáveis, em ordem sugerida (backend → frontend). Cada tarefa é pequena, verificável e referencia os arquivos a criar/alterar. Marque `[x]` ao concluir.

**Convenções:** caminhos a partir da raiz `gametracker/`. Todas as operações escopadas por `user_id` via `get_current_user`. Jogos sempre referenciados por external id (`"rawg-3328"`) em URLs e payloads, como o módulo `games` já faz.

---

## Épico 1 — Backend: domínio e aplicação

### T1. Domain — entidades e exceções
- `backend/app/modules/game_lists/domain/entities.py`: adicionar dataclasses `ListedGame(game_id: str /*external*/, name, cover_url: str | None, platforms: list[str], release_year: int | None, added_at)` e `GameListPreview(game_list: GameList, game_count: int, cover_urls: list[str], contains_game: bool | None = None)`. Atualizar o comentário do `MAX_GAMES_PER_LIST` (o limite passa a ser aplicado).
- `backend/app/modules/game_lists/domain/exceptions.py`: adicionar `GameAlreadyInList`, `GameListFull`, `GameNotInList`.
- **DoD:** entidades e exceções importáveis.

### T2. Domain — Protocols (repositório de itens + port de catálogo)
- `backend/app/modules/game_lists/domain/repositories.py`: adicionar `GameListItemRepository` (`add(*, list_id, game_id) -> ListedGame`, `remove(*, list_id, game_id) -> bool`, `exists(*, list_id, game_id) -> bool`, `count(list_id) -> int`, `list_games(list_id) -> list[ListedGame]`, `counts_by_list(list_ids) -> dict[int, int]`, `recent_covers(list_ids, *, limit=5) -> dict[int, list[str]]`, `list_ids_containing(*, list_ids, game_id) -> set[int]`) e `GameCatalog` (`ensure_game(external_id) -> int`, `resolve_game_id(external_id) -> int | None`).
- **DoD:** Protocols importáveis; `game_lists/domain` sem nenhum import de `games`.
- **Depende de:** T1.

### T3. Application — use cases novos (um arquivo por caso)
- `application/add_game_to_list.py` — `AddGameToListUseCase(list_repository, item_repository, game_catalog)`, `execute(*, user_id, list_id, external_id) -> ListedGame`: lista não é do user → `GameListNotFound`; `ensure_game`; `exists` → `GameAlreadyInList`; `count >= MAX_GAMES_PER_LIST` → `GameListFull`; `add`.
- `application/remove_game_from_list.py` — `RemoveGameFromListUseCase(list_repository, item_repository, game_catalog)`, `execute(*, user_id, list_id, external_id) -> None`: lista → `GameListNotFound`; `resolve_game_id` None ou `remove` False → `GameNotInList`.
- `application/get_list_games.py` — `GetListGamesUseCase(list_repository, item_repository)`, `execute(*, user_id, list_id) -> tuple[GameList, list[ListedGame]]`; lista → `GameListNotFound`.
- **DoD:** use cases importáveis; regras de 404/409/limite cobertas.
- **Depende de:** T2.

### T4. Application — enriquecer `GetUserListsUseCase`
- `application/get_user_lists.py`: novo construtor `(repository, item_repository, game_catalog)`; `execute(user_id, *, contains_external_id: str | None = None) -> list[GameListPreview]` — `counts_by_list` + `recent_covers(limit=5)` em lote (sem N+1); se `contains_external_id`, `resolve_game_id` + `list_ids_containing` para a flag (senão `None`).
- **DoD:** retorna previews com contagem, capas e flag; sem `gameId` a flag vem `None`.
- **Depende de:** T2, T3.

### T5. Testes unitários de aplicação
- `backend/tests/modules/game_lists/application/`: casos — adicionar ok; lista de outro usuário → `GameListNotFound`; duplicado → `GameAlreadyInList`; 50 itens → `GameListFull`; remover ok/inexistente → `GameNotInList`; `get_list_games` ordena por `added_at` desc; `get_user_lists` com/sem `contains_external_id` (flag correta; jogo não registrado → tudo `False`).
- **DoD:** `pytest tests/modules/game_lists/application` verde.
- **Depende de:** T3, T4.

---

## Épico 2 — Backend: infraestrutura e persistência

### T6. Model SQLAlchemy `game_list_items`
- `infrastructure/game_list_item_model.py`: `GameListItemModel(Base)`, tabela `game_list_items` — `id` BigInteger PK autoincrement; `list_id` FK→`game_lists.id` ondelete CASCADE not null; `game_id` FK→`games.id` ondelete CASCADE not null; `added_at` DateTime(timezone) default now. `UniqueConstraint("list_id","game_id", name="uq_game_list_items_list_game")` + `Index("ix_game_list_items_list_id", "list_id")`.
- **DoD:** model importável.
- **Depende de:** T1.

### T7. Repositório SQLAlchemy de itens + adaptador de catálogo
- `infrastructure/sqlalchemy_game_list_item_repository.py`: `SqlAlchemyGameListItemRepository(session)` implementando `GameListItemRepository`; join com `GameModel` para hidratar `ListedGame`; `list_games` order by `added_at.desc()`; `recent_covers` com 1 query `IN` + agrupamento em Python (5 primeiros `cover_url` não nulos por lista); `counts_by_list` com `group_by`+`func.count`; `add` com `flush()` retornando `ListedGame`.
- `infrastructure/games_catalog_adapter.py`: `GamesCatalogAdapter(details_use_case: GetGameDetailsUseCase, user_game_repository: UserGameRepository)` — `ensure_game` = `details_use_case.execute` + `find_internal_game_id`; `resolve_game_id` = só `find_internal_game_id`.
- **DoD:** implementam os Protocols; comentário registrando a exceção de import cross-módulo.
- **Depende de:** T2, T6.

### T8. Migration alembic
- Nova revisão `create_game_list_items_table`, `down_revision = "b8c9d0e1f2a3"`. `upgrade()` cria a tabela (FKs CASCADE, `added_at` `server_default=sa.func.now()`, unique + index); `downgrade()` faz drop de index e tabela. Formato de `b8c9d0e1f2a3_create_game_lists_table.py`.
- **DoD:** `alembic upgrade head` aplica e `alembic downgrade -1` reverte limpo (contra o Postgres do `docker-compose.yml`).
- **Depende de:** T6.

---

## Épico 3 — Backend: API

### T9. Schemas Pydantic
- `api/schemas.py`: estender `GameListResponse` com `game_count`→`gameCount`, `cover_urls`→`coverUrls` (default `[]`), `contains_game`→`containsGame` (`bool | None`, default `None`); criar `ListGameResponse`, `GameListDetailResponse`, `AddGameToListRequest`.
- **DoD:** serialização camelCase; `containsGame` ausente/`null` quando não solicitado.
- **Depende de:** T1.

### T10. Dependencies (wiring cross-módulo)
- `api/dependencies.py`: `get_game_list_item_repository(session)`, `get_game_catalog(details_uc=Depends(games.get_game_details_use_case), user_game_repo=Depends(games.get_user_game_repository))`, providers `get_add_game_to_list_use_case`, `get_remove_game_from_list_use_case`, `get_list_games_use_case`; atualizar `get_user_lists_use_case`.
- **DoD:** providers resolvem via `Depends`; único ponto que importa `games/api/dependencies`.
- **Depende de:** T3, T4, T7.

### T11. Controllers
- `api/controllers.py`: `GET /lists` ganha `game_id: str | None = Query(None, alias="gameId")` (monta resposta a partir de `GameListPreview`); `GET /lists/{list_id}` → 200 `GameListDetailResponse` (404 `GameListNotFound`); `POST /lists/{list_id}/games` → 201 `ListGameResponse` (`GameAlreadyInList`→409, `GameListFull`→422, `GameListNotFound`→404, `GameNotFound`→404, `GameProviderUnavailable`→502, `GameProviderNotConfigured`→503); `DELETE /lists/{list_id}/games/{game_id}` → 204 (`GameListNotFound`/`GameNotInList`→404).
- **DoD:** rotas conforme a tabela de contratos; visíveis em `/docs`.
- **Depende de:** T9, T10.

### T12. Fakes + testes de rota
- `backend/tests/conftest.py`: `FakeGameListItemRepository`; catálogo compondo `GamesCatalogAdapter` real sobre `FakeGameDetailProvider` + `FakeUserGameRepository`; fixtures + overrides dos novos providers; atualizar override de `get_user_lists_use_case`.
- `backend/tests/modules/game_lists/api/test_game_list_items_routes.py`: POST 201 camelCase; 409 duplicado; 422 na 51ª; 404 lista de outro usuário / jogo desconhecido; DELETE 204/404; `GET /lists/{id}` 200+404; `GET /lists?gameId=` flags true/false; `coverUrls`/`gameCount` no `GET /lists`; 401 em todas.
- Atualizar asserts de `test_game_lists_routes.py` afetados pelos campos novos.
- **DoD:** `cd backend && pytest` completo verde.
- **Depende de:** T11.

---

## Épico 4 — Frontend: dados e serviço

### T13. Tipos
- `frontend/src/types/list.ts`: estender `GameList` com `gameCount: number`, `coverUrls: string[]`, `containsGame?: boolean | null`; criar `ListGame { gameId; name; coverUrl: string | null; platforms: string[]; releaseYear: number | null; addedAt: string }` e `GameListDetail` (campos da lista + `items: ListGame[]`).
- **DoD:** tipos exportados; type-check dos usos existentes ok.

### T14. Serviço HTTP
- `frontend/src/services/lists.ts`: `getLists(gameId?)` (anexa `?gameId=${encodeURIComponent(gameId)}`), `getList(id): Promise<GameListDetail>`, `addGameToList(listId, gameId): Promise<void>` (`POST /lists/${listId}/games` body `{ gameId }`), `removeGameFromList(listId, gameId): Promise<void>` (`DELETE /lists/${listId}/games/${encodeURIComponent(gameId)}`).
- **DoD:** funções tipadas.
- **Depende de:** T13.

### T15. Textos
- `frontend/src/constants/texts.ts`: bloco `addToList` (`dialogTitle`, `loadError`, `emptyTitle`/`emptyDescription`, `createListCta`, `alreadyInListLabel`, `listFullLabel`, contagem, `successMessage`, `errorMessage`, `alreadyInListError`, `listFullError`, `closeButton`); `gameDetails.addToListButton`; `myLists.removeGameAriaLabel`/`removeGameSuccessMessage`/`removeGameErrorMessage`; **atualizar** `myLists.detailGamesEmptyDescription`.
- **DoD:** zero strings hardcoded nos componentes novos.

---

## Épico 5 — Frontend: UI

Convenções do CLAUDE.md: MUI + `styled-components`, cores via tokens de `src/theme/colors.ts`, textos via `src/constants/texts.ts`.

### T16. Organism `AddToListDialog` (reutilizável)
- `frontend/src/components/organisms/AddToListDialog/` (`AddToListDialog.tsx` + `index.ts`), padrão `AddGameModal` (Dialog + `FeedbackModal` próprio): props `{ open, gameId, onClose, onAdded? }`. Ao abrir: `getLists(gameId)`; loading/erro/vazio (`EmptyState` + CTA para `/my-lists`). `List`/`ListItemButton`: nome + contagem; `CheckIcon` + disabled quando `containsGame`; disabled quando `gameCount >= 50`. Clique → `addGameToList` → sucesso atualiza item local + `onAdded`; catch 409 → `alreadyInListError` (marca item), 422 → `listFullError`. `stopEvent` no Dialog.
- **DoD:** cobre loading/erro/vazio/sucesso/409; reutilizável pelas duas entradas.
- **Depende de:** T13, T14, T15.

### T17. Habilitar "Adicionar à lista" no `GameCardMenu` (Meus Jogos)
- `GameCardMenu.tsx`: prop `onAddToList?: () => void`; o `<MenuItem disabled>` vira funcional (fecha o menu + chama o callback), mantendo `disabled` sem a prop. `GameCard.tsx` e `MyGamesGrid.tsx`: repassar `onAddToList(gameId)`. `MyGamesPage.tsx`: estado `addToListGameId: string | null` e **um único** `AddToListDialog` no nível da página.
- **DoD:** item de menu abre o seletor com listas e flags.
- **Depende de:** T16.

### T18. Botão "Adicionar à lista" na `GameDetailsPage`
- `GameDetailsHeader.tsx`: prop `onAddToList`; segundo botão (`variant="outlined"`, `PlaylistAddIcon`, `gameDetails.addToListButton`) ao lado de "Quero jogar" (agrupar numa row styled). `GameDetailsPage.tsx`: estado `addToListOpen` e `AddToListDialog` (feedback próprio do dialog).
- **DoD:** botão abre o seletor; listas com o jogo aparecem marcadas/desabilitadas.
- **Depende de:** T16.

### T19. `ListCard` com capas reais
- `ListCard.tsx`: `PosterRow` renderiza `list.coverUrls.slice(0,5)` como `<img>` (`object-fit: cover`, `alt=""` decorativo) dentro dos slots; slots restantes continuam `PosterSlot` placeholder.
- **DoD:** listas com jogos mostram até 5 capas mais recentes; listas vazias mantêm o visual atual.
- **Depende de:** T13.

### T20. `MyListDetailPage` — grid de jogos + remoção
- Novo molecule `frontend/src/components/molecules/ListGameCard/` (variação enxuta do `GameCard` para `ListGame`: `CardLink` para `/games/:id`, capa 3/4, nome, meta via `formatYear`, `IconButton` remover sobre a capa com `preventDefault`+`stopPropagation`). Novo organism `frontend/src/components/organisms/ListGamesGrid/` (empty state + grid). `MyListDetailPage.tsx`: trocar `getLists()+find` por `getList(Number(listId))` (`404 → not-found`), renderizar `ListGamesGrid`; `handleRemove` → `removeGameFromList` + filtro local + `FeedbackModal`.
- **DoD:** página busca pelo novo endpoint, exibe jogos e remove com feedback; empty state preservado.
- **Depende de:** T13, T14, T15.

### T21. Testes de frontend
- Escrever/revisar com a skill `/test-skill`; todo componente novo com ao menos um teste; `vi.mock` de services, providers de tema, `MemoryRouter` onde há `Link`.
  - `AddToListDialog.test.tsx` (flag/disabled, clique chama `addGameToList`, 409, empty); `ListGameCard.test.tsx`; `ListGamesGrid.test.tsx`; `GameCardMenu.test.tsx` (item habilitado/desabilitado); `GameDetailsHeader.test.tsx` (novo botão); `MyListDetailPage.test.tsx` (`getList`, remoção, 404); `ListCard.test.tsx` (capas + placeholders).
  - **Atualizar mocks existentes** com `gameCount`/`coverUrls` (`MyListsPage.test`, `MyListsGrid.test`, `ListCard.test`, `MyListDetailPage.test`).
- **DoD:** `cd frontend && npm test` verde.
- **Depende de:** T16–T20.

---

## Épico 6 — Verificação e fechamento

### T22. Verificação end-to-end
- Backend: `cd backend && pytest` verde; `alembic upgrade head` / `alembic downgrade -1` limpos.
- Frontend: `cd frontend && npm test && npm run build && npm run lint` verdes.
- Manual: (1) página do jogo → "Adicionar à lista" → seletor → adicionar → reabrir e ver check/disabled; (2) mesmo fluxo pelo menu de Meus Jogos; (3) duplicado na API → 409; (4) 50 jogos → 422 + "Lista cheia" no seletor; (5) capas no `ListCard` em `/my-lists`; (6) abrir a lista, remover jogo, persistência após reload; (7) 401 sem cookie nas rotas novas.
- **DoD:** os 4 critérios de aceitação atendidos.
- **Depende de:** T12, T21.

### T23. Sugestão de commit
- Ao final, sugerir `feat(lists): add and remove games from custom lists` (Conventional Commits, CLAUDE.md).
- **DoD:** mensagem sugerida ao usuário.
- **Depende de:** T22.

---

## Rastreabilidade — Critérios de Aceitação → Tarefas
- **Botão "Adicionar à lista" na página do jogo** → T9–T11 (POST), T16, T18
- **Menu "Adicionar à lista" funcional em Meus Jogos** → T16, T17
- **Indicador de jogo já na lista** → T4 (`containsGame` no GET /lists), T11, T16 (marca/desabilita), T12 (409)
- **Remover jogo da lista** → T3 (remove use case), T11 (DELETE), T14, T20
- **Capas nos poster slots (decisão do usuário)** → T4 (`coverUrls`), T7 (`recent_covers`), T19
- **Limite de 50 jogos/lista** → T1 (comentário), T3 (`GameListFull`), T11 (422)

## Fora de escopo (histórias futuras)
- Reordenar jogos na lista; toggle público/privado na UI; listas públicas / compartilhamento.
