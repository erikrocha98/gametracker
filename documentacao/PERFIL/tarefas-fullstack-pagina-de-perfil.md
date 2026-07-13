# Tarefas — Página de Perfil do usuário

Divisão do [plano-fullstack-pagina-de-perfil.md](plano-fullstack-pagina-de-perfil.md) em
tarefas implementáveis. Cada tarefa é pensada para ser **um commit independente**, com
código + testes juntos, e deixa a aplicação funcionando ao final.

## Correções sobre o plano (encontradas na revisão)

- O tipo ENUM do Postgres se chama **`user_game_status`** (criado na migração
  `d4e5f6a7b8c9_add_status_to_user_games.py`), e não `usergamestatus` como o plano cita.
  A migração da T4 deve usar `ALTER TYPE user_game_status ADD VALUE ...`.
- Os use cases do backend vivem em `application/` (não `use_cases/` como diz o CLAUDE.md) —
  o plano já segue o padrão real do repositório; manter `application/`.
- Não existe `types/user.ts` no frontend; o tipo `User` está em `services/auth.ts`.
  A T7 estende esse tipo onde ele já está (sem criar arquivo novo desnecessário).
- O molecule `EmptyState` já existe em `components/molecules/EmptyState/` — reutilizar
  na T10, não criar outro.

## Ordem e dependências

```
Backend:   T1 → T2 → T3          T4 → T5
                          ╲       ╱
                           T6 (depende de T4)
Frontend:  T7 (depende de T3, T5, T6) → T8 → T9 → T10 → T11
```

T1–T3 (users) e T4–T6 (games) são trilhas independentes entre si e podem ser feitas
em qualquer ordem. O frontend (T7+) só começa quando os endpoints existirem.

---

## Backend — módulo `users`

### T1 — Coluna `bio` no usuário (migração + entidade + model)

**Escopo:**
- Nova migração Alembic em `backend/alembic/versions/`: `ALTER TABLE users ADD COLUMN bio TEXT NULL`
  (com `downgrade` removendo a coluna).
- `users/domain/entities.py`: adicionar `bio: str | None = None` à entidade `User`.
- `users/infrastructure/models.py`: adicionar `bio: Mapped[str | None]`.
- Ajustar o mapeamento model ↔ entidade em `users/infrastructure/repositories.py` para
  incluir `bio`.

**Pronto quando:** `alembic upgrade head` roda sem erro e a suíte `pytest` existente
continua verde.

### T2 — `UpdateBioUseCase` + repositório

**Escopo:**
- Protocolo em `users/domain/repositories.py`: método `update_bio(user_id, bio) -> User`.
- Implementação em `users/infrastructure/repositories.py`.
- Novo use case `users/application/update_bio.py`: valida tamanho máximo (500 chars),
  levanta exceção de domínio (`users/domain/exceptions.py`) quando exceder.
- **Testes** em `tests/modules/users/application/test_update_bio.py` com fake de
  repositório: atualiza a bio, rejeita bio acima do limite, aceita `None`/vazia.
  Atualizar o fake de usuários existente com `update_bio`.

**Depende de:** T1.
**Pronto quando:** testes do use case passam.

### T3 — API: estender `GET /auth/me` + novo `PATCH /auth/me`

**Escopo:**
- `users/api/schemas.py`: incluir no `MeResponse` os campos `bio`, `avatar_url`
  (sempre `None` por ora, alias `avatarUrl`) e `created_at` (alias `memberSince`);
  novo `UpdateBioRequest { bio }`.
- `users/api/controllers.py`: estender `GET /auth/me` com os campos acima; adicionar
  `PATCH /auth/me` (autenticado via `get_current_user`) que chama o `UpdateBioUseCase`.
- `users/api/dependencies.py`: injeção do use case.
- **Testes** em `tests/modules/users/api/test_auth_routes.py`: `GET /auth/me` retorna os
  campos novos; `PATCH /auth/me` altera a bio (200) e retorna 422/400 para bio inválida;
  401 sem sessão.

**Depende de:** T2.
**Pronto quando:** `GET /auth/me` retorna `bio`/`avatarUrl`/`memberSince` e
`PATCH /auth/me` persiste a bio.

---

## Backend — módulo `games`

### T4 — Status `playing` (enum + migração)

**Escopo:**
- `games/domain/entities.py`: adicionar `playing = "playing"` ao `UserGameStatus`.
- Nova migração Alembic:
  `ALTER TYPE user_game_status ADD VALUE IF NOT EXISTS 'playing'`.
  ⚠️ `ADD VALUE` não roda dentro de transação no Postgres — executar com autocommit
  (`op.get_bind().execution_options(isolation_level="AUTOCOMMIT")` ou equivalente).
  `downgrade` pode ser no-op documentado (remover valor de enum não é suportado).

**Pronto quando:** `alembic upgrade head` roda sem erro e um `user_game` aceita o
status `playing`.

### T5 — Alterar status: use case + endpoint `PATCH /games/{external_id}/status`

**Escopo:**
- Protocolo em `games/domain/repositories.py`: `set_status(user_id, game_id, status)`.
- Implementação em `games/infrastructure/sqlalchemy_user_game_repository.py`.
- Novo use case `games/application/set_game_status.py` (`SetGameStatusUseCase`):
  valida que o jogo está na coleção do usuário (senão exceção de domínio já usada
  pelo módulo).
- `games/api/schemas.py`: request/response do status.
- `games/api/controllers.py` + `dependencies.py`: `PATCH /games/{external_id}/status`.
- **Testes:** `tests/modules/games/application/test_set_game_status.py` (muda status,
  incl. `playing`; erro se o jogo não está na coleção) e caso de rota em
  `tests/modules/games/api/` seguindo `test_rating_routes.py`. Atualizar
  `FakeUserGameRepository` com `set_status`.

**Depende de:** T4.
**Pronto quando:** endpoint muda o status e testes passam.

### T6 — Estatísticas da coleção: use case + `GET /games/stats`

**Escopo:**
- Novo use case `games/application/get_collection_stats.py`
  (`GetCollectionStatsUseCase`): reutiliza `list_by_user(user_id)` (já ordenado por
  `added_at DESC`) e computa em memória:
  - `games_rated` — itens com `rating != None`;
  - `average_rating` — média das notas (ou `None` sem notas);
  - `status_counts` — `{ want_to_play, playing, finished }`;
  - `recent_games` — primeiros 6 itens, com `status` e `rating`.
- `games/api/schemas.py`: `CollectionStatsResponse`; adicionar `status` ao item de
  coleção já retornado por `GET /games/collection`.
- `games/api/controllers.py` + `dependencies.py`: `GET /games/stats`.
  ⚠️ Registrar a rota **antes** de rotas dinâmicas tipo `/games/{external_id}` para
  `stats` não ser capturado como id.
- **Testes:** `tests/modules/games/application/test_get_collection_stats.py`
  (contagens por status, avaliados, média, recentes na ordem certa, coleção vazia)
  e caso de rota em `tests/modules/games/api/`.

**Depende de:** T4 (usa o status `playing` nas contagens).
**Pronto quando:** `GET /games/stats` reflete a coleção e testes passam.

---

## Frontend

### T7 — Tipos e serviços

**Escopo:**
- `types/game.ts`: adicionar `status` a `CollectionGame`; novo tipo
  `CollectionStats { gamesRated, averageRating, statusCounts, recentGames }` e o tipo
  do status (union `'want_to_play' | 'playing' | 'finished'`).
- `services/auth.ts`: estender o tipo `User` com `bio`, `avatarUrl`, `memberSince`;
  novo `updateBio(bio)` → `PATCH /auth/me`.
- `services/games.ts`: `getCollectionStats()` → `GET /games/stats`;
  `setGameStatus(gameId, status)` → `PATCH /games/{id}/status`.

**Depende de:** T3, T5, T6 (contratos dos endpoints).
**Pronto quando:** `npm run build` (type-check) passa.

### T8 — Atoms/molecules base: `Avatar` e `StatCard`

**Escopo:**
- Atom `components/atoms/Avatar/`: MUI `Avatar` com iniciais derivadas do username.
- Molecule `components/molecules/StatCard/`: número + label + ícone.
- Tokens: reutilizar `theme/colors.ts`; textos ainda não são necessários aqui
  (componentes recebem label por prop).
- **Testes** (via `/test-skill`): iniciais corretas no `Avatar`; `StatCard` renderiza
  valor e label.

**Depende de:** nada (pode andar em paralelo com o backend).
**Pronto quando:** componentes renderizam e testes passam.

### T9 — Opções de status no `GameCardMenu` (marca "Jogando")

**Escopo:**
- `constants/texts.ts`: labels de status reaproveitáveis
  (`statusWantToPlay`, `statusPlaying`, `statusFinished`) na seção `myGames`.
- `components/molecules/GameCardMenu/`: opções "Quero jogar / Jogando / Jogado"
  chamando `onStatusChange(status)`.
- Encadear a prop: `GameCard` → `MyGamesGrid` → `MyGamesPage`
  (`handleStatusChange` usando `setGameStatus` + atualização da lista local).
- **Testes** (via `/test-skill`): clicar na opção de status chama `onStatusChange`
  com o valor certo.

**Depende de:** T7.
**Pronto quando:** dá para marcar um jogo como "Jogando" em "Meus jogos".

### T10 — Organisms do perfil: `ProfileCard`, `ProfileStats`, `StatusCounters`, `RecentGames`

**Escopo:**
- `constants/texts.ts`: nova seção `profile` completa (títulos, labels, placeholder da
  bio, mensagens de sucesso/erro, empty state, "Em breve").
- Organism `ProfileCard` (coluna esquerda): `Avatar` (iniciais), Nome e Username
  somente-leitura, Bio editável (textarea + botão "Salvar" via `updateBio`, feedback
  com `FeedbackModal`), estatísticas resumidas (Jogos, Nota média).
- Organism `ProfileStats`: `StatCard`s de Jogos avaliados, Reviews (0 / "Em breve"),
  Listas (0 / "Em breve").
- Organism `StatusCounters`: contadores "Quero jogar", "Jogando", "Jogado".
- Organism `RecentGames`: grid reutilizando `GameCard` (só link, sem menu) e o
  molecule `EmptyState` existente ("Você ainda não avaliou nenhum jogo." + botão
  "Adicionar um jogo") quando vazio.
- **Testes** (via `/test-skill`): `StatusCounters`/`ProfileStats` renderizam
  valores/labels; `ProfileCard` — editar bio chama `updateBio` e reflete o valor;
  `RecentGames` — mostra empty state quando vazio.

**Depende de:** T7, T8.
**Pronto quando:** organisms renderizam isolados com dados mockados e testes passam.

### T11 — `ProfilePage` + rota `/profile`

**Escopo:**
- `components/pages/ProfilePage/ProfilePage.tsx` seguindo o padrão de `MyGamesPage`
  (useState + useEffect + loading/error + `FeedbackModal`): busca `getMe()` (ou
  `useAuth()`) + `getCollectionStats()` e compõe o layout de duas colunas com os
  organisms da T10.
- `routes/AppRoutes.tsx`: trocar `ComingSoonPage` por `ProfilePage` na rota `/profile`.
- **Teste** (via `/test-skill`): com serviços mockados (`vi.mock`), monta stats +
  recentes e trata estado de erro.

**Depende de:** T10.
**Pronto quando:** `/profile` renderiza o perfil completo.

---

## Checklist de verificação final (após T11)

Backend:
```bash
cd backend && source .venv/bin/activate
alembic upgrade head
pytest
```

Frontend:
```bash
cd frontend
npm run lint && npm run build && npm run test
```

Manual (com `docker-compose up` + dev servers):
- [ ] `GET /auth/me` retorna `bio`, `avatarUrl`, `memberSince`; `PATCH /auth/me` altera a bio.
- [ ] `PATCH /games/{id}/status` muda o status; `GET /games/stats` reflete contagens, média e recentes.
- [ ] `/profile`: card à esquerda (avatar por iniciais, nome, username, bio editável), atividade à direita.
- [ ] Reviews/Listas exibem 0 / "Em breve".
- [ ] Marcar um jogo como "Jogando" em "Meus jogos" incrementa o contador no perfil.
- [ ] Coleção vazia mostra o `EmptyState` com ação "Adicionar um jogo".
