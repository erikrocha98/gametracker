# Plano: Criar listas personalizadas de jogos

## Context

**História:** Como usuário, quero criar listas personalizadas de jogos para organizar minhas coleções.

Hoje o app tem uma "coleção" (want-to-play / playing / finished) por usuário, mas não permite agrupar jogos em listas nomeadas e independentes (ex.: "RPGs favoritos", "Zerados em 2025"). A rota `/my-lists` já existe no frontend, mas aponta para uma `ComingSoonPage` placeholder. Esta história cria a base de **listas** — o container com nome, descrição e privacidade — para organizar coleções.

**Escopo decidido com o usuário:**
- **Apenas CRUD de listas** (criar, listar, editar, excluir). Adicionar/remover jogos a uma lista fica para uma história futura.
- **Público/privado** entra como **coluna no banco** (`is_public`, default `false` = privado), **sem toggle na UI** — débito técnico explícito para a evolução em rede social.
- **Limite de 50 jogos/lista**: como adicionar jogos está fora do escopo, o limite entra apenas como **constante de domínio** (`MAX_GAMES_PER_LIST = 50`), documentada e pronta para ser aplicada quando a associação lista↔jogo existir. Sem tabela de junção nesta história.
- Entrega **full-stack**: API + página `/my-lists`.

**Resultado esperado:** usuário autenticado consegue criar listas (nome + descrição), ver suas listas, editar e excluir, tudo persistido e escopado por usuário.

## Padrões existentes a reutilizar

O backend segue DDD/hexagonal por módulo (`domain` / `application` / `infrastructure` / `api`). A feature espelha de perto o módulo `games`/coleção. Referências (caminhos a partir da raiz do repositório `gametracker/`):
- Model + repo: `backend/app/modules/games/infrastructure/user_game_model.py`, `backend/app/modules/games/infrastructure/sqlalchemy_user_game_repository.py`
- Use cases: `backend/app/modules/games/application/get_user_collection.py`, `backend/app/modules/games/application/add_game_to_collection.py`
- API (router, schemas com alias camelCase, dependencies): `backend/app/modules/games/api/controllers.py`, `backend/app/modules/games/api/schemas.py`, `backend/app/modules/games/api/dependencies.py`
- Auth: `get_current_user` de `backend/app/modules/users/api/dependencies.py`
- Migration modelo: `backend/alembic/versions/c3d4e5f6a7b8_create_user_games_table.py` (head atual da cadeia = **`a7b8c9d0e1f2`**)
- Testes: fakes por dependency-override em `backend/tests/conftest.py`; estilo em `backend/tests/modules/games/api/test_collection_routes.py`

Frontend (atomic design): serviço `frontend/src/services/games.ts` sobre `frontend/src/services/http.ts`; página modelo `frontend/src/components/pages/MyGamesPage/MyGamesPage.tsx`; modal modelo `frontend/src/components/organisms/AddGameModal/AddGameModal.tsx`; textos centralizados em `frontend/src/constants/texts.ts`; rotas em `frontend/src/routes/AppRoutes.tsx`.

---

## Backend — novo módulo `app/modules/game_lists/`

Criar módulo próprio espelhando `games`. Todas as operações escopadas por `user_id` via `get_current_user`.

### domain/
- **entities.py** — dataclass `GameList` (`id`, `user_id`, `name`, `description: str | None`, `is_public: bool`, `created_at`, `updated_at`). Constante `MAX_GAMES_PER_LIST = 50` no topo do módulo (comentário citando débito técnico do limite).
- **repositories.py** — `Protocol GameListRepository`: `create(*, user_id, name, description, is_public=False) -> GameList`, `list_by_user(user_id) -> list[GameList]`, `get(*, user_id, list_id) -> GameList | None`, `update(*, user_id, list_id, name, description) -> GameList`, `delete(*, user_id, list_id) -> bool`.
- **exceptions.py** — `GameListNotFound`.

### application/
Um use case por arquivo (padrão do repo), cada um recebendo `repository` no `__init__` e expondo `execute(...)`:
- `create_game_list.py` — `CreateGameListUseCase` (default `is_public=False`).
- `get_user_lists.py` — `GetUserListsUseCase`.
- `update_game_list.py` — `UpdateGameListUseCase` (raise `GameListNotFound` se `get` retornar `None`).
- `delete_game_list.py` — `DeleteGameListUseCase` (raise `GameListNotFound` se `delete` retornar `False`).

### infrastructure/
- **game_list_model.py** — `GameListModel(Base)`, tabela `game_lists`: `id` BigInteger PK autoincrement; `user_id` BigInteger FK→`users.id` ondelete CASCADE, not null; `name` String(120) not null; `description` Text nullable; `is_public` Boolean not null default `false`; `created_at`/`updated_at` DateTime(timezone) com default `now()` (updated_at com `onupdate`). Index `ix_game_lists_user_id` em `user_id`.
- **sqlalchemy_game_list_repository.py** — `SqlAlchemyGameListRepository` implementando o Protocol; método privado `_hydrate(row) -> GameList`. `list_by_user` ordena por `created_at.desc()`.

### api/
- **schemas.py** — Pydantic com `model_config = {"populate_by_name": True, "from_attributes": True}` e alias camelCase (padrão do módulo games):
  - `CreateGameListRequest` (`name: str` min_length=1 max_length=120; `description: str | None = None`)
  - `UpdateGameListRequest` (mesmos campos)
  - `GameListResponse` (`id`, `name`, `description`, `is_public`→`isPublic`, `created_at`→`createdAt`, `updated_at`→`updatedAt`)
  - `GameListsResponse` (`items: list[GameListResponse]`)
- **dependencies.py** — `get_game_list_repository(session)` e um provider por use case (padrão de `backend/app/modules/games/api/dependencies.py`).
- **controllers.py** — `router = APIRouter(prefix="/lists", tags=["lists"])`:
  - `POST /lists` → 201, `GameListResponse`
  - `GET /lists` → `GameListsResponse`
  - `PUT /lists/{list_id}` → `GameListResponse` (404 em `GameListNotFound`)
  - `DELETE /lists/{list_id}` → 204 (404 em `GameListNotFound`)
  - Todas com `current_user: User = Depends(get_current_user)`.

### Wiring
- Registrar `game_lists_router` em `backend/app/main.py` (`app.include_router(...)`).

### Migration
- Nova revisão alembic `create_game_lists_table`, `down_revision = "a7b8c9d0e1f2"`. `upgrade()` cria a tabela `game_lists` (colunas acima) + index; `downgrade()` faz drop do index e da tabela. Seguir formato de `backend/alembic/versions/c3d4e5f6a7b8_create_user_games_table.py`.

### Testes (backend)
- Adicionar `FakeGameListRepository` + fixture e overrides em `backend/tests/conftest.py` (registrar os novos `get_*_use_case` em `app.dependency_overrides`).
- `backend/tests/modules/game_lists/api/test_game_lists_routes.py`: criar (201 + payload/alias camelCase), listar (só do próprio usuário), editar, editar inexistente (404), excluir (204), excluir inexistente (404), 401 sem auth, validação de nome vazio (422).
- Opcional: testes unitários por use case em `backend/tests/modules/game_lists/application/`.

---

## Frontend — página `/my-lists`

### types
- `src/types/list.ts` — `interface GameList { id: number; name: string; description: string | null; isPublic: boolean; createdAt: string; updatedAt: string }` e `GameListsResponse { items: GameList[] }`.

### service
- `src/services/lists.ts` — sobre `http`: `getLists()`, `createList(name, description)`, `updateList(id, name, description)`, `deleteList(id)`. (privacidade não exposta — débito técnico.)

### textos
- Adicionar bloco `myLists` em `frontend/src/constants/texts.ts`: título da página, CTA "Criar lista", labels de nome/descrição, mensagens de sucesso/erro (criar/editar/excluir), empty state, e mapear no `userMenu.myLists` já existente.

### componentes (atomic design)
- **organism `CreateListModal`** (espelha `AddGameModal`): `Dialog` do MUI com campos nome (obrigatório) e descrição; reaproveita `FeedbackModal`. Serve para criar e editar (prop opcional de lista inicial).
- **molecule `ListCard`**: card com nome, descrição e ações editar/excluir.
- **page `MyListsPage`** (espelha `MyGamesPage`): busca `getLists` no mount, grid de `ListCard`, botão "Criar lista" abrindo o modal, empty state (`EmptyState`), feedback via `FeedbackModal`. Sem paginação nesta fase (opcional reusar `PaginationControls`).

### rota
- Em `frontend/src/routes/AppRoutes.tsx`, trocar `<ComingSoonPage />` da rota `/my-lists` por `<MyListsPage />`.

### testes (frontend)
- `MyListsPage.test.tsx` seguindo o padrão de `MyGamesPage.test.tsx`: mock de `services/lists`, render do título e do empty state, criação abrindo modal. Teste de render do `ListCard`.

---

## Verificação

**Backend**
- `cd gametracker/backend && pytest` — todos os testes verdes, incluindo os novos de `game_lists`.
- `alembic upgrade head` (com Postgres do `docker-compose.yml`) aplica a migration sem erro; `alembic downgrade -1` reverte limpo.
- Smoke manual (com backend rodando): autenticar, então `POST /lists` `{ "name": "RPGs" }` → 201; `GET /lists` retorna a lista; `PUT /lists/{id}`; `DELETE /lists/{id}` → 204; chamadas sem cookie → 401.

**Frontend**
- `cd gametracker/frontend && npm test` — suites verdes.
- `npm run dev` + backend: navegar em `/my-lists`, criar uma lista pelo modal (feedback de sucesso, aparece no grid), editar, excluir; recarregar e confirmar persistência.

**End-to-end**: subir via `docker-compose.yml`, logar e exercitar o fluxo criar → listar → editar → excluir.

## Fora de escopo (débitos técnicos registrados)
- Adicionar/remover jogos em listas e a tabela de junção `game_list_items` (aplicará `MAX_GAMES_PER_LIST`).
- Toggle público/privado na UI e endpoints de listas públicas (rede social).
