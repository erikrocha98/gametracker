# Plano Fullstack — INT-01: Atribuição de nota a um jogo

## Contexto

Estamos iniciando o épico de **interação**. A primeira história (INT-01, *Must have*) permite ao
usuário dar uma nota a um jogo para registrar sua avaliação:

- Escala **0.5 a 5.0**, incremento de **0.5**.
- No frontend, a nota usa **ícones de manete de videogame** (estilo Letterboxd, mas com gamepads):
  ícones apagados que acendem conforme a nota, com suporte a **meia nota** (metade do ícone acesa).
- Possibilidade de **alterar** e **remover** a nota.
- Nota **visível na página do jogo** e (futuramente) no perfil.

Decisões de produto confirmadas com o usuário:
1. **Avaliar auto-adiciona à coleção** — se o jogo ainda não está na coleção, dar nota cria a entrada (estilo Letterboxd).
2. **Avaliar marca como `finished`** — ao gravar a nota, o `status` do jogo passa para `finished`.
3. **Perfil adiado** — a página `/profile` continua como *ComingSoon*. A nota será exibida agora **na página do jogo** e no **card de My Games**. O perfil completo fica para outra tarefa.

A nota é gravada na entrada da coleção do usuário (tabela `user_games`), que já existe e já tem o conceito de `status`. Toda a feature espelha o padrão da feature de coleção mais recente.

---

## Backend (`backend/app/modules/games/`)

### 1. Domínio
- **`domain/entities.py`** — adicionar `rating: float | None = None` ao dataclass `UserGame`.
- **`domain/exceptions.py`** — adicionar `class InvalidRating(Exception)`. Reusar `GameNotInCollection` para remoção quando não há nota/jogo.
- **`domain/repositories.py`** (`UserGameRepository` Protocol) — adicionar:
  - `add(...)` ganha parâmetro opcional `status: UserGameStatus = UserGameStatus.want_to_play` (o fake em `tests/conftest.py` já tem essa assinatura; alinhar o real).
  - `get(self, *, user_id: int, game_id: int) -> UserGame | None`
  - `set_rating(self, *, user_id: int, game_id: int, rating: float) -> UserGame` (também seta `status=finished`)
  - `clear_rating(self, *, user_id: int, game_id: int) -> bool`

### 2. Infraestrutura
- **`infrastructure/user_game_model.py`** — adicionar coluna `rating: Mapped[float | None] = mapped_column(Numeric(2, 1), nullable=True)`.
- **`infrastructure/sqlalchemy_user_game_repository.py`**:
  - `add(...)` recebe `status` e o repassa ao `UserGameModel`.
  - `set_rating` — busca a linha por `user_id`+`game_id`, seta `rating` e `status=finished`, `flush`, retorna `_hydrate`.
  - `clear_rating` — seta `rating=None` (mantém o `status`), retorna `bool`.
  - `get` — retorna `_hydrate` da linha ou `None`.
  - `_hydrate` — incluir `rating=float(row.rating) if row.rating is not None else None`.
- **Migração** `backend/alembic/versions/e5f6a7b8c9d0_add_rating_to_user_games.py`
  (mesma estrutura de `d4e5f6a7b8c9_add_status_to_user_games.py`, `down_revision = "d4e5f6a7b8c9"`):
  `op.add_column("user_games", sa.Column("rating", sa.Numeric(2, 1), nullable=True))` / `drop_column` no downgrade.

### 3. Use cases (`application/`)
- **`rate_game.py` — `RateGameUseCase`** (espelha `add_game_to_collection.py`):
  recebe `details_use_case` + `repository`. `execute(*, user_id, external_id, rating)`:
  valida nota (0.5–5.0, múltiplo de 0.5 → senão `InvalidRating`); `details_use_case.execute(external_id)` (garante que o jogo existe/está em cache); resolve `internal_id`; se `not exists`, `repo.add(..., status=finished)`; retorna `repo.set_rating(...)`.
- **`remove_rating.py` — `RemoveRatingUseCase`** (espelha `remove_game_from_collection.py`):
  `execute(*, user_id, external_id)` → resolve `internal_id`; se `None` ou `not clear_rating(...)` → `GameNotInCollection`.
- **`get_user_game_rating.py` — `GetUserGameRatingUseCase`**:
  `execute(*, user_id, external_id) -> float | None` → resolve `internal_id`; `repo.get(...)`; retorna `.rating`.

### 4. API (`api/`)
- **`schemas.py`**:
  - `CollectionGameResponse` — adicionar `rating: float | None = Field(None)`.
  - `GameDetailResponse` — adicionar `user_rating: float | None = Field(None, alias="userRating")`.
  - Novo `RateGameRequest` — `rating: float = Field(..., ge=0.5, le=5.0, multiple_of=0.5)` (validação 422 automática; `InvalidRating` no use case é defesa em profundidade).
- **`dependencies.py`** — adicionar `get_rate_game_use_case`, `get_remove_rating_use_case`, `get_user_game_rating_use_case` (mesma fiação `Depends` das existentes).
- **`controllers.py`**:
  - `_to_collection_response` — passar `rating=user_game.rating`.
  - `PUT /games/{game_id}/rating` → 200, `response_model=CollectionGameResponse`. Trata `InvalidRating`→422, `GameNotFound`→404, `GameProviderUnavailable`→502, `GameProviderNotConfigured`→503 (espelha o `POST /want-to-play`).
  - `DELETE /games/{game_id}/rating` → 204. Trata `GameNotInCollection`→404.
  - `GET /games/{game_id}` — trocar `_current_user` por `current_user`, injetar `GetUserGameRatingUseCase` e preencher `userRating` na resposta.

### 5. Testes (`backend/tests/`)
- **`tests/conftest.py`** — `FakeUserGameRepository`: adicionar `rating` no `add`/entidade, e os métodos `get`, `set_rating` (seta `status=finished`), `clear_rating`. Registrar overrides dos 3 novos use cases no `api_client`.
- **`tests/modules/games/application/`** — `test_rate_game.py` (sucesso, auto-add quando ausente, marca finished, nota inválida → `InvalidRating`), `test_remove_rating.py`, `test_get_user_game_rating.py`.
- **`tests/modules/games/api/test_rating_routes.py`** — PUT feliz, PUT valor inválido (422), PUT auto-add, DELETE feliz (204), DELETE sem nota (404), e `GET /games/{id}` retornando `userRating`.

---

## Frontend (`frontend/src/`)

### 1. Camada de dados
- **`services/http.ts`** — adicionar método `put` (hoje só há `get`/`post`/`delete`):
  `put: <T>(path, body?) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) })`.
- **`types/game.ts`** — `CollectionGame` ganha `rating: number | null`; `GameDetailResponse` ganha `userRating: number | null`.
- **`services/games.ts`** — `rateGame(gameId, rating): Promise<CollectionGame>` (`http.put('/games/${gameId}/rating', { rating })`) e `removeRating(gameId): Promise<void>` (`http.delete('/games/${gameId}/rating')`).

### 2. Componente de nota (novo) — molécula `GamepadRating`
- Pasta `components/molecules/GamepadRating/` (`GamepadRating.tsx`, `index.ts`, `GamepadRating.test.tsx`).
- Usa o **`Rating` do MUI** (`@mui/material`) com `precision={0.5}` — ele já faz o preenchimento de **meio ícone** via clip:
  - `icon={<SportsEsportsIcon />}` e `emptyIcon={<SportsEsportsIcon />}` (mesmo ícone já usado em `GameCard.tsx`).
  - Cor preenchida = `colors.primary`; cor apagada = `colors.inputBorder` (tokens existentes em `theme/colors.ts`, sem cores hardcoded).
- Props: `value: number | null`, `onChange?: (value: number | null) => void`, `readOnly?: boolean`, `size?: 'small' | 'medium'`.
  `onChange` do MUI entrega `null` ao clicar na mesma nota → usamos isso para acionar **remover nota**.

### 3. Página do jogo
- **`organisms/GameDetailsHeader/GameDetailsHeader.tsx`** — abaixo da `RatingsRow`, bloco "Sua nota" com o `GamepadRating` interativo. Novas props: `userRating`, `onRate`, `onRemoveRating`, `ratingLoading`.
- **`pages/GameDetailsPage/GameDetailsPage.tsx`** — estado `userRating` (inicial = `data.userRating`); handlers `handleRate`/`handleRemoveRating` chamando `rateGame`/`removeRating`, com `FeedbackModal` (padrão já existente). Em sucesso de nota: atualizar `userRating` e marcar `added=true` (auto-add/finished).

### 4. Card de My Games
- **`molecules/GameCard/GameCard.tsx`** — quando `game.rating != null`, exibir `GamepadRating` `readOnly size="small"` abaixo do nome. Aparece automaticamente pois `getCollection` passará a retornar `rating`.

### 5. Textos — `constants/texts.ts`
- Em `gameDetails`: `yourRatingLabel: 'Sua nota'`, `rateSuccess`, `rateError`, `ratingRemovedSuccess`, `removeRatingError`. Sem strings hardcoded nos componentes.

### 6. Testes
- `GamepadRating.test.tsx` — renderiza nota cheia/meia, modo `readOnly`, dispara `onChange` ao selecionar. Padrão de render com `MuiThemeProvider`+`StyledThemeProvider` de `RatingBadge.test.tsx`.

---

## Verificação (end-to-end)

Backend:
```bash
cd backend && source .venv/bin/activate
pip install -r requirements.txt          # se necessário
alembic upgrade head                      # aplica a migração de rating
pytest                                    # roda os novos testes + suíte
```

Frontend:
```bash
cd frontend
npm run lint
npm run build        # type-check + bundle
npx vitest run       # testes de componente
```

Fluxo manual (com `docker-compose up` + dev servers):
1. Abrir a página de um jogo **não** adicionado, dar uma nota (ex.: 4.5) → ícones acendem (4 cheios + meio), feedback de sucesso.
2. Verificar que o jogo aparece em **My Games** com `status=finished` e a nota exibida no card.
3. Alterar a nota (ex.: 3.0) na página do jogo → persiste após reload (`GET /games/{id}` retorna `userRating`).
4. Remover a nota (clicar na mesma nota) → ícones apagam; o jogo permanece na coleção; nota some do card.
5. Conferir validação: nota fora de 0.5–5.0 / fora do passo 0.5 retorna 422.

---

## Comandos para o usuário rodar ao final
(o usuário roda build/testes/migração por conta própria)
- `cd backend && source .venv/bin/activate && alembic upgrade head`
- `cd backend && pytest`
- `cd frontend && npm run lint && npm run build && npx vitest run`

## Sugestão de commit
`feat(rating): allow users to rate games with gamepad rating widget`
