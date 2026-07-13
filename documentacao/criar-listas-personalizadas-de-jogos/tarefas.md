# Tarefas: Criar listas personalizadas de jogos

Quebra do [plano.md](plano.md) em tarefas implementáveis, em ordem sugerida (backend → frontend). Cada tarefa é pequena, verificável e referencia os arquivos a criar/alterar. Marque `[x]` ao concluir.

**Convenções:** caminhos a partir da raiz do repositório `gametracker/`. Novo módulo backend: `app/modules/game_lists/`. Todas as operações escopadas por `user_id` via `get_current_user`.

---

## Épico 1 — Backend: domínio e aplicação

### T1. Estrutura do módulo `game_lists`
- Criar pacote `backend/app/modules/game_lists/` com `__init__.py` e subpacotes `domain/`, `application/`, `infrastructure/`, `api/` (cada um com `__init__.py`).
- **DoD:** `python -c "import app.modules.game_lists"` sem erro.

### T2. Domain — entidade e constante
- `domain/entities.py`: dataclass `GameList` (`id`, `user_id`, `name`, `description: str | None`, `is_public: bool`, `created_at`, `updated_at`).
- Constante `MAX_GAMES_PER_LIST = 50` no topo do módulo, com comentário citando o débito técnico do limite.
- **DoD:** entidade importável; constante definida.
- **Depende de:** T1.

### T3. Domain — repositório (Protocol) e exceção
- `domain/repositories.py`: `Protocol GameListRepository` com `create(*, user_id, name, description, is_public=False)`, `list_by_user(user_id)`, `get(*, user_id, list_id)`, `update(*, user_id, list_id, name, description)`, `delete(*, user_id, list_id) -> bool`.
- `domain/exceptions.py`: `GameListNotFound`.
- **DoD:** Protocol e exceção importáveis.
- **Depende de:** T2.

### T4. Application — use cases (um arquivo por caso)
- `application/create_game_list.py` — `CreateGameListUseCase` (default `is_public=False`).
- `application/get_user_lists.py` — `GetUserListsUseCase`.
- `application/update_game_list.py` — `UpdateGameListUseCase` (raise `GameListNotFound` se `get` retornar `None`).
- `application/delete_game_list.py` — `DeleteGameListUseCase` (raise `GameListNotFound` se `delete` retornar `False`).
- Padrão: `repository` no `__init__`, método `execute(...)`.
- **DoD:** os 4 use cases importáveis, com a regra de 404 nos de update/delete.
- **Depende de:** T3.

### T5. Testes unitários de aplicação (opcional, recomendado)
- `backend/tests/modules/game_lists/application/` (com `__init__.py`): um teste por use case usando um fake em memória do repositório — criar, listar (só do usuário), editar/editar-inexistente (raise), excluir/excluir-inexistente (raise).
- **DoD:** `pytest tests/modules/game_lists/application` verde.
- **Depende de:** T4.

---

## Épico 2 — Backend: infraestrutura e persistência

### T6. Model SQLAlchemy
- `infrastructure/game_list_model.py`: `GameListModel(Base)`, tabela `game_lists` — `id` BigInteger PK autoincrement; `user_id` BigInteger FK→`users.id` ondelete CASCADE, not null; `name` String(120) not null; `description` Text nullable; `is_public` Boolean not null default `false`; `created_at`/`updated_at` DateTime(timezone) default `now()` (`updated_at` com `onupdate`). Index `ix_game_lists_user_id`.
- **DoD:** model importável; espelha `user_game_model.py`.
- **Depende de:** T2.

### T7. Repositório SQLAlchemy
- `infrastructure/sqlalchemy_game_list_repository.py`: `SqlAlchemyGameListRepository` implementando o Protocol; `_hydrate(row) -> GameList`; `list_by_user` ordena por `created_at.desc()`. `update`/`delete` filtram por `user_id` + `list_id`.
- **DoD:** implementa todos os métodos do Protocol.
- **Depende de:** T3, T6.

### T8. Migration alembic
- Nova revisão `create_game_lists_table` em `backend/alembic/versions/`, `down_revision = "a7b8c9d0e1f2"`. `upgrade()` cria a tabela + index; `downgrade()` faz drop de ambos. Seguir formato de `c3d4e5f6a7b8_create_user_games_table.py`.
- **DoD:** `alembic upgrade head` aplica sem erro e `alembic downgrade -1` reverte limpo (contra o Postgres do `docker-compose.yml`).
- **Depende de:** T6.

---

## Épico 3 — Backend: API

### T9. Schemas Pydantic
- `api/schemas.py`: `CreateGameListRequest` (`name` min_length=1 max_length=120; `description: str | None = None`), `UpdateGameListRequest`, `GameListResponse` (aliases camelCase: `isPublic`, `createdAt`, `updatedAt`), `GameListsResponse`. `model_config = {"populate_by_name": True, "from_attributes": True}`.
- **DoD:** schemas importáveis; serialização em camelCase.
- **Depende de:** T2.

### T10. Dependencies (wiring dos use cases)
- `api/dependencies.py`: `get_game_list_repository(session)` + um provider por use case (padrão de `games/api/dependencies.py`).
- **DoD:** providers resolvem via `Depends`.
- **Depende de:** T4, T7.

### T11. Controllers (router `/lists`)
- `api/controllers.py`: `router = APIRouter(prefix="/lists", tags=["lists"])` com:
  - `POST /lists` → 201 `GameListResponse`
  - `GET /lists` → `GameListsResponse`
  - `PUT /lists/{list_id}` → `GameListResponse` (404 em `GameListNotFound`)
  - `DELETE /lists/{list_id}` → 204 (404 em `GameListNotFound`)
  - Todas com `current_user = Depends(get_current_user)`.
- **DoD:** rotas respondem conforme especificado.
- **Depende de:** T9, T10.

### T12. Registrar router no app
- `backend/app/main.py`: `app.include_router(game_lists_router)`.
- **DoD:** rotas aparecem em `/docs`.
- **Depende de:** T11.

### T13. Testes de API + fakes no conftest
- Adicionar `FakeGameListRepository` + fixture e overrides dos novos `get_*_use_case` em `backend/tests/conftest.py`.
- `backend/tests/modules/game_lists/api/test_game_lists_routes.py` (com `__init__.py`): criar (201 + alias camelCase), listar (só do próprio usuário), editar, editar inexistente (404), excluir (204), excluir inexistente (404), 401 sem auth, nome vazio (422).
- **DoD:** `pytest` completo verde.
- **Depende de:** T11, T12.

---

## Épico 4 — Frontend: dados e serviço

### T14. Tipos
- `frontend/src/types/list.ts`: `GameList { id; name; description: string | null; isPublic; createdAt; updatedAt }` e `GameListsResponse { items: GameList[] }`.
- **DoD:** tipos exportados.

### T15. Serviço HTTP
- `frontend/src/services/lists.ts` sobre `http`: `getLists()`, `createList(name, description)`, `updateList(id, name, description)`, `deleteList(id)`. Privacidade não exposta.
- **DoD:** funções tipadas usando os endpoints `/lists`.
- **Depende de:** T14 (e, para runtime, T11).

### T16. Textos
- `frontend/src/constants/texts.ts`: bloco `myLists` (título da página, CTA "Criar lista", labels nome/descrição, mensagens sucesso/erro de criar/editar/excluir, empty state). Reaproveitar `userMenu.myLists` já existente.
- **DoD:** textos centralizados, sem strings hardcoded nos componentes.

---

## Épico 5 — Frontend: UI

### T17. Molecule `ListCard`
- `frontend/src/components/molecules/ListCard/` (`ListCard.tsx` + `index.ts`): nome, descrição e ações editar/excluir.
- **DoD:** renderiza props; dispara callbacks de editar/excluir.
- **Depende de:** T14, T16.

### T18. Organism `CreateListModal`
- `frontend/src/components/organisms/CreateListModal/` (espelha `AddGameModal`): `Dialog` MUI com nome (obrigatório) e descrição; reaproveita `FeedbackModal`; prop opcional de lista inicial para reuso em edição.
- **DoD:** cria e edita; valida nome vazio; emite callback ao salvar.
- **Depende de:** T15, T16.

### T19. Page `MyListsPage`
- `frontend/src/components/pages/MyListsPage/` (espelha `MyGamesPage`): `getLists` no mount, grid de `ListCard`, botão "Criar lista" abrindo o modal, `EmptyState`, feedback via `FeedbackModal`.
- **DoD:** fluxo criar → listar → editar → excluir funciona na tela.
- **Depende de:** T15, T16, T17, T18.

### T20. Rota `/my-lists`
- `frontend/src/routes/AppRoutes.tsx`: trocar `<ComingSoonPage />` por `<MyListsPage />` na rota `/my-lists`.
- **DoD:** navegar a `/my-lists` renderiza a nova página.
- **Depende de:** T19.

### T21. Testes de frontend
- `MyListsPage.test.tsx` (padrão de `MyGamesPage.test.tsx`): mock de `services/lists`, render do título e empty state, abrir modal de criação. Teste de render do `ListCard`.
- **DoD:** `npm test` verde.
- **Depende de:** T17, T19.

---

## Épico 6 — Verificação e fechamento

### T22. Verificação end-to-end
- Backend: `cd backend && pytest` verde; `alembic upgrade head` ok.
- Frontend: `cd frontend && npm test` verde.
- Manual (via `docker-compose.yml`): logar, `POST /lists` → 201, `GET /lists`, editar, `DELETE` → 204, 401 sem cookie; na UI criar/editar/excluir e confirmar persistência após reload.
- **DoD:** todos os critérios de aceitação atendidos (nome, descrição, `is_public` persistido como débito técnico, constante de limite 50 presente).
- **Depende de:** T13, T21.

---

## Rastreabilidade — Critérios de Aceitação → Tarefas
- **Nome da lista** → T2, T6, T9, T11, T18/T19
- **Descrição da lista** → T2, T6, T9, T11, T18/T19
- **Pública/privada (débito técnico)** → T2, T6 (`is_public` default `false`), T8 (coluna) — sem UI
- **Limite de 50 jogos/lista** → T2 (`MAX_GAMES_PER_LIST = 50`, constante pronta para uso futuro)

## Fora de escopo (histórias futuras)
- Associação lista↔jogo (tabela `game_list_items`) e aplicação efetiva do `MAX_GAMES_PER_LIST`.
- Toggle público/privado na UI e endpoints de listas públicas.
