# Plano fullstack — Página de Perfil do usuário

## Contexto

O usuário quer uma página de perfil que mostre a própria atividade. A rota `/profile`
já existe (protegida) mas aponta para o `ComingSoonPage`
([AppRoutes.tsx](../../frontend/src/routes/AppRoutes.tsx)). É preciso substituí-la por uma
`ProfilePage` real.

Referência visual: [perfil.png](../perfil.png) — layout de duas colunas:
- **Esquerda** — card "Perfil": avatar, Nome, Username, Bio (editável) + botão **Salvar**,
  e estatísticas resumidas embaixo.
- **Direita** — área de atividade ("Suas avaliações" / jogos recentes) com empty state
  ("Você ainda não avaliou nenhum jogo." + botão "Adicionar um jogo").

### Critérios de aceitação
- Avatar, nome de usuário, bio
- Estatísticas: jogos avaliados, reviews, listas
- Jogos recentes (últimas notas/status)
- Contadores de status (Jogando, Jogado, etc.)

> Onde o mockup (versão anterior) e os critérios divergem, **os critérios prevalecem**
> (ex.: o mockup não mostra avatar nem contadores de status; ambos entram por serem
> critério de aceitação).

### Decisões de escopo (confirmadas com o usuário)
- **Avatar/Bio:** avatar gerado pelas iniciais do username (sem upload). Apenas a **bio** é
  editável (coluna nullable + `PATCH`). Nome/Username ficam somente-leitura.
- **Status:** adicionar o status `playing` ("Jogando") ao domínio, com forma de marcá-lo.
- **Reviews/Listas:** contadores exibidos como `0` / "Em breve" (módulos ainda não existem).

### Princípio arquitetural respeitado
Módulos não importam entre si (CLAUDE.md). Por isso o perfil é **composto no frontend** a
partir de dois endpoints independentes: um do módulo `users` (dados do usuário + bio) e um
do módulo `games` (estatísticas da coleção). Reviews/listas = `0` são constantes do
frontend.

---

## Backend

### 1. Módulo `users` — bio + campos no /auth/me
- **Migração Alembic** nova em `backend/alembic/versions/`: adiciona coluna `bio TEXT NULL`
  em `users`.
- **Entidade** [users/domain/entities.py](../../backend/app/modules/users/domain/entities.py):
  adicionar `bio: str | None = None`.
- **Model** [users/infrastructure/models.py](../../backend/app/modules/users/infrastructure/models.py):
  `bio: Mapped[str | None]`.
- **Repositório** [users/infrastructure/repositories.py](../../backend/app/modules/users/infrastructure/repositories.py):
  adicionar `update_bio(user_id, bio) -> User` (+ método no protocolo em `domain/`).
- **Use case** novo em `users/application/`: `UpdateBioUseCase` (valida tamanho máximo,
  ex.: 500 chars).
- **Schemas** [users/api/schemas.py](../../backend/app/modules/users/api/schemas.py):
  incluir `bio`, `avatar_url` (sempre `None` por ora, alias `avatarUrl`) e `created_at`
  (alias `memberSince`) no `MeResponse`; novo `UpdateBioRequest { bio }`.
- **Controllers** [users/api/controllers.py](../../backend/app/modules/users/api/controllers.py):
  estender `GET /auth/me` com os campos acima; adicionar `PATCH /auth/me` (bio) usando
  `get_current_user` + use case injetado via `users/api/dependencies.py`.

### 2. Módulo `games` — status `playing` + estatísticas
- **Enum** [games/domain/entities.py](../../backend/app/modules/games/domain/entities.py):
  adicionar `playing = "playing"` ao `UserGameStatus`.
- **Migração Alembic** nova: `ALTER TYPE usergamestatus ADD VALUE IF NOT EXISTS 'playing'`.
  ⚠️ `ADD VALUE` não roda dentro de transação no Postgres — usar bloco autocommit
  (`connection.execution_options(isolation_level="AUTOCOMMIT")`) ou executar fora da
  transação padrão do Alembic.
- **Alterar status:** novo use case `SetGameStatusUseCase` + método de repositório
  `set_status(user_id, game_id, status)` (protocolo em
  [games/domain/repositories.py](../../backend/app/modules/games/domain/repositories.py)
  e impl. em `sqlalchemy_user_game_repository.py`). Endpoint
  `PATCH /games/{external_id}/status` em
  [games/api/controllers.py](../../backend/app/modules/games/api/controllers.py).
- **Estatísticas:** novo use case `GetCollectionStatsUseCase` que reutiliza
  `list_by_user(user_id)` (já ordena por `added_at DESC`) e computa em memória:
  - `games_rated` = itens com `rating != None`;
  - `average_rating` = média das notas (para "Nota média" do mockup);
  - `status_counts` = `{ want_to_play, playing, finished }`;
  - `recent_games` = primeiros N (ex.: 6) itens, incluindo `status` e `rating`.
  Endpoint `GET /games/stats` (response `CollectionStatsResponse` em
  [games/api/schemas.py](../../backend/app/modules/games/api/schemas.py)).
  Adicionar `status` ao item de coleção retornado (para exibir no card recente).

### 3. Testes backend (`pytest` + fakes, sem infra real)
Espelhar em `backend/tests/modules/...` seguindo o padrão de
`tests/modules/games/application/test_rate_game.py` e os fakes do `conftest.py`:
- `GetCollectionStatsUseCase`: contagens, jogos avaliados, média, recentes ordenados.
- `SetGameStatusUseCase`: muda status (incl. `playing`).
- `UpdateBioUseCase`: atualiza bio / valida limite.
Atualizar `FakeUserGameRepository` e `FakeUserRepo` com `set_status`/`update_bio`.

---

## Frontend

### 4. Tipos e serviços
- [types/game.ts](../../frontend/src/types/game.ts): adicionar `status` a `CollectionGame`;
  novo tipo `CollectionStats { gamesRated, averageRating, statusCounts, recentGames }`.
- `types/user.ts` (ou estender o `User` em `services/auth.ts`): `bio`, `avatarUrl`,
  `memberSince`.
- [services/auth.ts](../../frontend/src/services/auth.ts): `getMe` já existe (passa a trazer
  os campos novos); novo `updateBio(bio)` → `PATCH /auth/me`.
- [services/games.ts](../../frontend/src/services/games.ts): `getCollectionStats()` →
  `GET /games/stats`; `setGameStatus(gameId, status)` → `PATCH /games/{id}/status`.

### 5. Componentes (Atomic Design, styled-components, MUI, tokens de cor/texto)
Layout de duas colunas conforme o mockup.
- **Page** `components/pages/ProfilePage/ProfilePage.tsx` — substitui o `ComingSoonPage` na
  rota `/profile` em [AppRoutes.tsx](../../frontend/src/routes/AppRoutes.tsx). Segue o
  padrão de [MyGamesPage.tsx](../../frontend/src/components/pages/MyGamesPage/MyGamesPage.tsx)
  (useState + useEffect + loading/error + `FeedbackModal`). Busca `getMe()` (ou usa
  `useAuth()`) + `getCollectionStats()` e compõe.
- **Coluna esquerda — Organism `ProfileCard`:**
  - `Avatar` (iniciais), Nome e Username (somente-leitura), Bio editável (textarea +
    "Salvar" via `updateBio`, feedback via `FeedbackModal`).
  - Estatísticas resumidas: Jogos, Nota média.
- **Coluna direita — atividade:**
  - `ProfileStats` — cards de Jogos avaliados, Reviews (0/Em breve), Listas (0/Em breve).
  - `StatusCounters` — contadores de "Quero jogar", "Jogando", "Jogado".
  - `RecentGames` — grid reutilizando
    [GameCard](../../frontend/src/components/molecules/GameCard/GameCard.tsx) (só link, sem
    menu), com `EmptyState` ("Você ainda não avaliou nenhum jogo." + ação) quando vazio.
- **Atoms/molecules:** `Avatar` atom (MUI `Avatar` com iniciais); `StatCard` molecule
  (número + label + ícone).
- **Marcar "Jogando":** estender
  [GameCardMenu](../../frontend/src/components/molecules/GameCardMenu/GameCardMenu.tsx) com
  opções de status ("Quero jogar / Jogando / Jogado") chamando `onStatusChange(status)`;
  encadear em `GameCard` → `MyGamesGrid` → `MyGamesPage` (`handleStatusChange` usando
  `setGameStatus`). É o caminho de reuso para o contador de "Jogando" ficar populável.

### 6. Textos e cores
- [constants/texts.ts](../../frontend/src/constants/texts.ts): nova seção
  `profile: { pageTitle, nameLabel, usernameLabel, bioLabel, bioPlaceholder, saveBio,
  memberSinceLabel, statsTitle, gamesLabel, averageRatingLabel, gamesRatedLabel,
  reviewsLabel, listsLabel, comingSoon, activityTitle, emptyActivity, addGame, statusTitle,
  statusWantToPlay, statusPlaying, statusFinished, bioUpdateSuccess, bioUpdateError }` e
  labels de status reaproveitáveis em `myGames`.
- [theme/colors.ts](../../frontend/src/theme/colors.ts): reutilizar tokens existentes;
  adicionar token novo só se surgir cor inédita (sem hardcode).

### 7. Testes frontend (`vitest` + Testing Library, via `/test-skill`)
Um teste de comportamento por componente novo (providers MUI + styled, `userEvent`,
queries por papel/label). Prioridade:
- `StatusCounters` e `ProfileStats` — renderizam valores/labels corretos.
- `ProfileCard` — edição de bio chama `updateBio` e reflete o valor.
- `GameCardMenu` — nova opção de status chama `onStatusChange`.
- `ProfilePage` — com serviços mockados (`vi.mock`), monta stats + recentes e trata erro.

---

## Verificação (end-to-end)

Backend:
```bash
cd backend && source .venv/bin/activate
alembic upgrade head
pytest
uvicorn app.main:app --reload
```
- `GET /auth/me` retorna `bio`, `avatarUrl`, `memberSince`.
- `PATCH /auth/me` altera a bio.
- `PATCH /games/{id}/status` muda o status; `GET /games/stats` reflete contagens,
  jogos avaliados, média e recentes.

Frontend:
```bash
cd frontend
npm run lint && npm run build && npm run test
npm run dev
```
- Acessar `/profile`: card à esquerda com avatar (iniciais), nome, username e bio editável;
  atividade à direita.
- Cards de estatísticas (avaliados/nota média reais; reviews/listas = 0 "Em breve").
- Contadores por status batem com a coleção; marcar um jogo como "Jogando" em "Meus jogos"
  incrementa o contador.
- Jogos recentes aparecem (ou `EmptyState` quando não há).

## Fora de escopo
- Upload de imagem de avatar (apenas iniciais).
- Edição de Nome/Username (somente-leitura por ora).
- Módulos de reviews e listas (contadores ficam em 0 / "Em breve").
- Perfis públicos de outros usuários (apenas o próprio, via sessão).
