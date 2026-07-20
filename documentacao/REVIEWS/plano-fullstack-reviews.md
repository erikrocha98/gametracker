# Plano — Reviews de jogos (fullstack)

## Contexto

**História:** "Como usuário, quero escrever uma review sobre um jogo para compartilhar minha opinião."

**Critérios de aceitação:**
- Campo de texto com limite de 5000 caracteres
- Review vinculada à nota do jogo
- Possibilidade de editar ou excluir a review
- Data de criação visível

**Decisões (confirmadas com o usuário):**
1. **Review e nota são independentes** — ambos são campos opcionais no mesmo registro (`user_games`), exibidos juntos. Não é preciso ter nota para escrever review.
2. **Escopo completo** — editor na página do jogo + habilitar "Adicionar review" no menu do card + construir a página `/reviews` (hoje `ComingSoonPage`) listando as reviews do usuário.
3. **Armazenamento em colunas de `user_games`** — espelha o padrão da nota (`rating`), tudo dentro do módulo `games`.

A review nasce da relação usuário↔jogo, que já vive em `user_games` (id, user_id, game_id, status, rating). Toda a feature espelha o fluxo de rating existente: `PUT/DELETE /games/{id}/rating` → agora também `/review`; a nota é exposta em `GameDetailResponse.userRating` e renderizada no `GameDetailsHeader` → a review segue o mesmo caminho.

---

## Backend — módulo `games`

### 1. Migração
Novo arquivo em `backend/alembic/versions/` (rodar `alembic heads` para pegar o `down_revision` atual):
- `ALTER TABLE user_games ADD COLUMN review TEXT NULL`
- `ADD COLUMN review_created_at TIMESTAMPTZ NULL`
- `ADD COLUMN review_updated_at TIMESTAMPTZ NULL`
- `downgrade` remove as três colunas.

### 2. Domínio
- `games/domain/entities.py` — `UserGame`: adicionar `review: str | None = None`, `review_created_at: datetime | None = None`, `review_updated_at: datetime | None = None`.
- `games/domain/exceptions.py` — nova `ReviewTooLong` (mesmo padrão de `InvalidRating`/`BioTooLong`).
- `games/domain/repositories.py` (protocolo `UserGameRepository`) — `set_review(user_id, game_id, review) -> UserGame` e `clear_review(user_id, game_id) -> bool`.

### 3. Infraestrutura
- `infrastructure/user_game_model.py` — três colunas (`Text` + `DateTime(timezone=True)`).
- `infrastructure/sqlalchemy_user_game_repository.py`:
  - `set_review`: define `review`; `review_created_at` só na primeira vez (mantém se já existe), `review_updated_at = now`.
  - `clear_review`: zera as três colunas; retorna `False` se a linha não existe.
  - `_hydrate`: mapear os campos novos.

### 4. Aplicação (use cases)
- `application/write_review.py` `WriteReviewUseCase` — espelha `rate_game.py`: `MAX_REVIEW_LENGTH = 5000`, normaliza (`strip`), rejeita vazio e `> 5000` (`ReviewTooLong`); resolve o jogo via `GetGameDetailsUseCase`, e se não estiver na coleção faz `add(status=want_to_play)` (auto-add, como o rating faz); depois `set_review`.
- `application/remove_review.py` `RemoveReviewUseCase` — espelha `remove_rating.py`: `clear_review`, `GameNotInCollection` se não houver.
- `application/get_user_game_review.py` `GetUserGameReviewUseCase` — espelha `get_user_game_rating.py`; retorna `(review, review_created_at)` ou `None` (para injetar no detalhe do jogo).
- `application/get_user_reviews.py` `GetUserReviewsUseCase` — reusa `list_by_user(user_id)` (já ordenado por `added_at DESC`), filtra `review is not None` para a página `/reviews`.

### 5. API
- `api/schemas.py`:
  - `WriteReviewRequest { review: str }`.
  - Estender `GameDetailResponse` com `user_review` (alias `userReview`) e `user_review_created_at` (alias `userReviewCreatedAt`).
  - `ReviewResponse { gameId, name, coverUrl, platforms, releaseYear, rating, review, reviewCreatedAt }` e `UserReviewsResponse { items: [...] }`.
- `api/controllers.py`:
  - `PUT /games/{game_id}/review` (mapeia `ReviewTooLong`→400).
  - `DELETE /games/{game_id}/review` (204; `GameNotInCollection`→404).
  - `GET /games/reviews` — **registrar antes** de `/{game_id}` (mesmo cuidado do `/stats`).
  - Estender `get_game_details` para também chamar `GetUserGameReviewUseCase`.
- `api/dependencies.py` — providers dos novos use cases.

### 6. Testes backend (`backend/tests/modules/games/...`)
- Atualizar `FakeUserGameRepository` (em `tests/conftest.py`) com `set_review`/`clear_review` e campos de review no `add`/`UserGame`; registrar overrides dos novos use cases no `api_client`.
- Use cases: `test_write_review.py` (cria, edita mantendo `created_at`, rejeita vazio e >5000, auto-add à coleção), `test_remove_review.py`, `test_get_user_reviews.py` (filtra por review, ordem).
- Rotas: `test_review_routes.py` seguindo `test_rating_routes.py` (200/400/404/401) e o detalhe do jogo retornando `userReview`/`userReviewCreatedAt`.

---

## Frontend

### 7. Tipos e serviços
- `types/game.ts` — `GameDetailResponse`: `userReview: string | null`, `userReviewCreatedAt: string | null`. Novos `UserReview` e `UserReviewsResponse`.
- `services/games.ts` — `writeReview(gameId, review)` (PUT), `removeReview(gameId)` (DELETE), `getUserReviews()` (GET `/games/reviews`).

### 8. Textos (`constants/texts.ts`)
- Em `gameDetails`: `reviewSectionTitle`, `reviewPlaceholder`, `reviewCharCounter` (ex.: `(n) => \`${n}/5000\``), `reviewSaveButton`, `reviewEditButton`, `reviewDeleteButton`, `reviewCreatedAtLabel`, mensagens de sucesso/erro (salvar/excluir) e confirmação de exclusão.
- Nova seção `reviews` (página): `pageTitle`, `emptyTitle`, `emptyDescription`, `emptyAction`, `loadError`. Reusar `myGames.menuReview` no menu do card.

### 9. Editor na página do jogo — organism `ReviewSection`
- `components/organisms/ReviewSection/` — recebe `review`, `reviewCreatedAt`, `onSave(text)`, `onDelete()`, `loading`.
  - Sem review: textarea (MUI `TextField multiline`, `maxLength 5000`) + contador + botão "Salvar" (desabilitado se vazio/estourado).
  - Com review: texto + **data de criação** (`formatReleaseDate`/`Intl`) + botões "Editar" e "Excluir".
  - Exclusão com diálogo de confirmação (reusar o padrão de confirmação já usado na exclusão de listas em `game_lists`) e `FeedbackModal`.
- Integrar no `GameDetailsPage.tsx`: estado + `handleSaveReview`/`handleDeleteReview` (via `writeReview`/`removeReview`), com override local espelhando `userRatingOverride` e reset por `gameId` já existente. Renderizar abaixo do `GameDetailsHeader`.

### 10. Menu do card — habilitar "Adicionar review"
- `GameCardMenu.tsx`: trocar o item `menuReview` de `disabled` para ativo, chamando `onReview()`.
- Encadear `onReview`: `GameCard` → `MyGamesGrid` → `MyGamesPage`, onde `handleReview(gameId)` navega para `/games/{gameId}` (`useNavigate`). Atualizar os testes/fakes de props obrigatórias (`renderGrid`, `renderMenu`).

### 11. Página `/reviews`
- `components/pages/ReviewsPage/` seguindo `MyGamesPage` (loading/error/empty): busca `getUserReviews()`, renderiza grid de reviews.
- Novo molecule `ReviewCard` (capa + nome do jogo + trecho da review + data + nota), link para `/games/{gameId}`. Reusar `GameCover` e `formatReleaseDate`; `EmptyState` quando vazio.
- `routes/AppRoutes.tsx`: `/reviews` passa a renderizar `ReviewsPage` (em vez de `ComingSoonPage`).

### 12. Testes frontend (via `/test-skill`)
- `ReviewSection`: escrever chama `onSave` com o texto; contador/limite de 5000; estado "com review" mostra data e botões; excluir (com confirmação) chama `onDelete`.
- `ReviewsPage`: lista reviews mockadas, empty state, erro.
- `ReviewCard`: renderiza nome, trecho e data.
- `GameCardMenu`: opção "Adicionar review" ativa chama `onReview`.

---

## Verificação

**Backend**
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend pytest
```

**Frontend**
```bash
cd frontend
npm run test
npm run build
npm run lint
```

**Manual (docker-compose up + dev servers)**
- Na página de um jogo: escrever review (≤5000), salvar → aparece com data de criação; editar → texto muda, data de criação mantida; excluir (com confirmação) → some.
- Review e nota coexistem de forma independente (dá pra ter review sem nota e vice-versa).
- Menu do card "Adicionar review" leva à página do jogo.
- `/reviews` lista os jogos com review; estado vazio com ação "Adicionar".

## Arquivos-chave (referência de padrões a reusar)
- Rating (espelho principal): `rate_game.py`, `remove_rating.py`, `get_user_game_rating.py`, rotas em `games/api/controllers.py`, `test_rating_routes.py`.
- Rota estática antes de dinâmica: `GET /games/stats` em `controllers.py`.
- Página de listagem: `components/pages/MyGamesPage/MyGamesPage.tsx`.
- Confirmação de exclusão + CRUD: módulo/feature `game_lists` (back e front).
- Editor de texto/textarea: `ProfileCard` (bio) e `FormField`.
