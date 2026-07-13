# Modelagem de Banco de Dados — v1

## Visão geral

Modelagem inicial para o **playlogd** baseada no backlog v1. Cobre autenticação, catálogo de jogos, interações (nota/review/status), listas personalizadas e perfil. Estruturada em duas camadas:

1. **Tabelas de estado** — guardam o estado atual (a nota do usuário, o status do jogo, etc.). Servem aos endpoints de leitura/escrita do dia-a-dia.
2. **Tabela de eventos** (`activity_events`) — registra cada mudança relevante feita por um usuário. Não é usada hoje na v1, mas garante que ao implementar feed/timeline na v2 (rede social) o histórico já estará disponível sem precisar de migration destrutiva.

### Decisões de design

- **PK numérica (`BIGSERIAL`) em toda tabela** — simplifica joins, foreign keys e tabelas de relacionamento futuras (amigos, seguidores).
- **Soft delete não usado** — exclusões são reais. Quando o histórico for relevante (review, lista), o registro vai para `activity_events`.
- **Timestamps `created_at` / `updated_at`** em todas as tabelas mutáveis, com `TIMESTAMPTZ` (UTC).
- **Catálogo local de jogos como cache** — apesar dos dados virem de IGDB/RAWG, persistimos os jogos consultados localmente para desacoplar consultas frequentes da API externa e permitir agregações futuras (nota média, jogos populares na plataforma).
- **`games.id` é `VARCHAR` com prefixo do provider** (`"rawg-3498"`) — provedor e id externo ficam codificados na PK, evitando uma coluna extra e mantendo a URL `GET /games/{id}` estável. Todas as FKs para `games` são `VARCHAR(50)`.
- **Gêneros, plataformas e desenvolvedores como JSON inline na `games`** — para a fase atual (CAT-02) bastam listas de strings vindas da RAWG. Normalização em tabelas separadas (`genres`, `platforms`, `tags` + N:N) entra junto com a história de filtros — ver [Para a fase de filtros](#para-a-fase-de-filtros-deferido) abaixo.
- **OAuth via coluna direta `google_id` em `users`** — escolhido em AUTH-03 pela simplicidade (um único provedor). Se um segundo provedor entrar, promover para uma tabela `oauth_accounts` (`provider`, `provider_user_id`) é migração aditiva.
- **Username e email com índice único** — exigência do backlog (AUTH-01).
- **Senha armazenada como hash** (bcrypt/argon2), nunca em texto puro. `password_hash` é nullable para suportar contas só-OAuth.
- **JSONB para `metadata` em `activity_events`** — flexibilidade para tipos de evento futuros sem nova migration.

---

## Tabelas de estado

### `users`

| Coluna | Tipo | Constraints | Observação |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | AUTH-01 exige único |
| `email` | VARCHAR(254) | NOT NULL, UNIQUE | |
| `password_hash` | VARCHAR(255) | NULL | NULL quando conta é apenas OAuth |
| `google_id` | VARCHAR(255) | NULL, UNIQUE | `sub` do Google (AUTH-03). NULL para contas sem vínculo OAuth. |
| `display_name` | VARCHAR(100) | NULL | PRF-02 |
| `bio` | VARCHAR(300) | NULL | PRF-02 (limite de 300 char) |
| `avatar_url` | TEXT | NULL | PRF-02 |
| `email_verified` | BOOLEAN | NOT NULL, DEFAULT FALSE | AUTH-01 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Índices:** `username`, `email`, `google_id` (todos únicos — `google_id` permite múltiplos NULLs no Postgres).

> **Sobre `google_id`:** AUTH-03 optou por uma coluna direta em vez de uma tabela `oauth_accounts` separada — um único provedor não justifica o overhead. Se for necessário suportar Apple/GitHub/etc., a migração para `oauth_accounts(user_id, provider, provider_user_id)` é puramente aditiva: move-se o valor existente para `('google', google_id)` e a coluna em `users` é deprecada.

---

### `email_verification_tokens` (AUTH-01)

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `token_hash` | VARCHAR(255) | NOT NULL — hash do token, nunca em claro |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `used_at` | TIMESTAMPTZ | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Índices:** `token_hash` (UNIQUE), `user_id`.

---

### `password_reset_tokens` (AUTH-04)

Mesma estrutura de `email_verification_tokens`. Mantida separada para distinguir intenção e auditoria.

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `token_hash` | VARCHAR(255) | NOT NULL |
| `expires_at` | TIMESTAMPTZ | NOT NULL — backlog: 1h |
| `used_at` | TIMESTAMPTZ | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

---

### `games`

Cache local dos jogos vindos da API externa (CAT-02). Não duplicamos todos os jogos da RAWG — apenas os que foram consultados ou interagidos. A busca (`/games/search`) hoje consulta a RAWG ao vivo (CAT-01); só o endpoint de detalhes (`/games/{id}`) persiste neste cache.

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK — PK numérica interna |
| `external_id` | VARCHAR(50) | NOT NULL — ID na API externa (ex.: `"3498"`) |
| `external_source` | VARCHAR(20) | NOT NULL — `'rawg'` (`'igdb'` no futuro) |
| `name` | VARCHAR(500) | NOT NULL |
| `description` | TEXT | NULL — texto plano |
| `release_date` | DATE | NULL |
| `cover_url` | TEXT | NULL |
| `genres` | JSONB | NULL — array de strings (`["RPG", "Action"]`) |
| `platforms` | JSONB | NULL — array de strings |
| `developers` | JSONB | NULL — array de strings |
| `screenshots` | JSONB | NULL — array de URLs (cap em 10) |
| `rawg_rating` | FLOAT | NULL — nota agregada do RAWG (0..5) |
| `cached_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() — quando foi gravado no cache local |

**Constraint:** UNIQUE (`external_source`, `external_id`).
**Índices:** `name` (GIN/trigram para busca textual quando a busca local for habilitada).

> **Identificação externa na API:** o endpoint `GET /games/{id}` aceita o id no formato `"<provider>-<external_id>"` (ex.: `"rawg-3498"`). O repositório quebra esse string e faz lookup por (`external_source`, `external_id`); a PK numérica interna nunca aparece na URL. Isso desacopla o id da API do id do banco e permite trocar de provider sem migration destrutiva.
>
> **Cache TTL:** invalidação fica fora desta fase — `cached_at` está aqui para suportar a lógica quando entrar.
>
> **Normalização:** `genres`/`platforms`/`developers` ficam inline em JSONB na fase atual; quando entrar a história de filtros, parte deles deve ser promovida para tabelas normalizadas (ver [Para a fase de filtros](#para-a-fase-de-filtros-deferido)).

---

### `ratings` (INT-01)

Nota atual do usuário para um jogo. Uma nota por par (usuário, jogo).

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `game_id` | BIGINT | NOT NULL, FK → `games.id` ON DELETE CASCADE |
| `value` | NUMERIC(2,1) | NOT NULL, CHECK (`value` BETWEEN 0.5 AND 5.0 AND `value` * 2 = FLOOR(`value` * 2)) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Constraint:** UNIQUE (`user_id`, `game_id`).
**Índices:** `game_id` (para média), `user_id`.

> A remoção da nota (backlog: "possibilidade de remover a nota") é um DELETE — o evento fica em `activity_events`.

---

### `reviews` (INT-02)

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `game_id` | BIGINT | NOT NULL, FK → `games.id` ON DELETE CASCADE |
| `body` | TEXT | NOT NULL, CHECK (LENGTH(`body`) ≤ 5000) |
| `has_spoiler` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Constraint:** UNIQUE (`user_id`, `game_id`) — uma review por usuário por jogo (backlog "review vinculada à nota").
**Índices:** `game_id`, `user_id`.

> A nota associada (INT-02 "Review vinculada à nota") é resolvida via join em `ratings` pelo par (`user_id`, `game_id`), evitando denormalização.

---

### `review_likes` (INT-04)

| Coluna | Tipo | Constraints |
|---|---|---|
| `user_id` | BIGINT | FK → `users.id` ON DELETE CASCADE |
| `review_id` | BIGINT | FK → `reviews.id` ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**PK composta:** (`user_id`, `review_id`).
**Índices:** `review_id` (para contagem).

---

### `game_user_statuses` (INT-05)

Status atual de um jogo para um usuário. Um único status corrente por par.

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `game_id` | BIGINT | NOT NULL, FK → `games.id` ON DELETE CASCADE |
| `status` | VARCHAR(20) | NOT NULL, CHECK (`status` IN ('playing','played','want_to_play','abandoned')) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Constraint:** UNIQUE (`user_id`, `game_id`).
**Índices:** `user_id` (para contagem por status no perfil — PRF-01).

> Histórico de status (ex.: "estava jogando → zerou") é reconstruído via `activity_events`. A tabela só guarda o status corrente.

---

### `game_lists` (LST-01..04)

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `name` | VARCHAR(100) | NOT NULL |
| `description` | TEXT | NULL |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Índices:** `user_id`, `is_public` (para listagem pública — LST-04).

### `game_list_items`

| Coluna | Tipo | Constraints |
|---|---|---|
| `list_id` | BIGINT | FK → `game_lists.id` ON DELETE CASCADE |
| `game_id` | BIGINT | FK → `games.id` ON DELETE CASCADE |
| `position` | INTEGER | NOT NULL — ordem para drag & drop (LST-03) |
| `added_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**PK composta:** (`list_id`, `game_id`).
**Índices:** (`list_id`, `position`) — leitura ordenada.

> Limite de 50 itens por lista (LST-01) é validado em código no use case, não no banco — facilita ajuste do limite no futuro.

---

## Tabela de eventos

### `activity_events`

Registro append-only de toda mudança relevante feita por um usuário. **Nunca é deletada ou atualizada** — eventos são imutáveis. Alimenta o feed/timeline da v2.

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `event_type` | VARCHAR(50) | NOT NULL |
| `target_type` | VARCHAR(20) | NULL — `'game'`, `'review'`, `'list'`, etc. |
| `target_id` | BIGINT | NULL — id na tabela de `target_type` (FK lógica, não enforced) |
| `game_id` | BIGINT | NULL, FK lógica → `games.id` — preenchido sempre que o evento se refere a um jogo (direta ou indiretamente, ex.: review/like/list item de um jogo). Denormalizado para suportar agregação eficiente (trending — ANA-01). |
| `metadata` | JSONB | NULL — payload específico do evento |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Índices:**
- (`user_id`, `created_at` DESC) — feed do próprio usuário e dos seguidos (v2).
- (`event_type`, `created_at` DESC) — feeds especializados.
- (`target_type`, `target_id`) — histórico de um jogo/review.
- (`game_id`, `created_at` DESC) — trending por jogo (ANA-01) e contagem de atividade recente sem parsear JSONB.

#### Catálogo inicial de `event_type`

`game_id` é coluna dedicada — preenchido sempre que o evento se refere a um jogo. `metadata` guarda só o que é específico do evento.

| `event_type` | `target_type` | `game_id` | `metadata` |
|---|---|---|---|
| `rating_created` | `game` | sim | `{ value: 4.5 }` |
| `rating_updated` | `game` | sim | `{ old_value: 3.0, new_value: 4.5 }` |
| `rating_removed` | `game` | sim | `{ old_value: 4.5 }` |
| `review_created` | `review` | sim | `{ has_spoiler }` |
| `review_updated` | `review` | sim | `{}` |
| `review_deleted` | `review` | sim | `{}` |
| `status_changed` | `game` | sim | `{ old_status, new_status }` |
| `status_removed` | `game` | sim | `{ old_status }` |
| `list_created` | `list` | não | `{ name, is_public }` |
| `list_updated` | `list` | não | `{ changes: ['name','description','is_public'] }` |
| `list_deleted` | `list` | não | `{ name }` |
| `game_added_to_list` | `list` | sim | `{}` |
| `game_removed_from_list` | `list` | sim | `{}` |
| `review_liked` | `review` | sim | `{ review_author_id }` |
| `review_unliked` | `review` | sim | `{ review_author_id }` |

> A escrita em `activity_events` deve ocorrer **no mesmo transaction** da escrita na tabela de estado (ex.: insere em `ratings` e em `activity_events` na mesma transação). Garante consistência sem precisar de outbox/CDC nessa fase.

---

## Relacionamentos resumidos

```
users 1 ──N email_verification_tokens
users 1 ──N password_reset_tokens
users 1 ──N ratings ──N games
users 1 ──N reviews ──N games
users 1 ──N review_likes ──N reviews
users 1 ──N game_user_statuses ──N games
users 1 ──N game_lists 1 ──N game_list_items ──N games
users 1 ──N activity_events
```

> Gêneros/plataformas/tags ficam inline em JSONB na coluna `games.<campo>` nesta fase; a normalização em N:N entra na fase de filtros (ver abaixo).
> Identidade OAuth do Google fica na coluna `users.google_id` nesta fase; uma tabela `oauth_accounts` separada entra se houver um segundo provedor.

---

## Para a fase de filtros (deferido)

Quando entrar a história de **filtros do catálogo** (filtrar por gênero, plataforma, tag, etc.), promover os campos JSON de `games` para tabelas normalizadas:

- **`genres`** — `id BIGSERIAL PK`, `name VARCHAR(100) NOT NULL UNIQUE`.
- **`platforms`** — `id BIGSERIAL PK`, `name VARCHAR(100) NOT NULL UNIQUE`.
- **`game_genres`** (N:N) — `game_id BIGINT FK games.id`, `genre_id BIGINT FK genres.id`. PK composta.
- **`game_platforms`** (N:N) — análogo.
- **`tags`** (atributos transversais: `pixel art`, `couch co-op`, `souls-like`, etc., origem `keywords`/`themes` da IGDB) — `id BIGSERIAL PK`, `name VARCHAR(100) NOT NULL UNIQUE`.
- **`game_tags`** (N:N) — análogo, com índice em `tag_id` para listar jogos por tag.

A migração é aditiva: cria as tabelas, popula a partir das colunas JSON existentes e mantém o JSON como fonte secundária até o frontend mover para as novas tabelas. Em seguida, as colunas JSON podem ser removidas em uma migration posterior.

> Por que JSON agora? Porque a fase atual (CAT-02 — detalhes do jogo) não filtra nem agrega por gênero/plataforma — só **exibe**. Normalizar antes de ter o use case é especulação.

---

## Considerações para a v2 (rede social)

A expansão para rede social é **puramente aditiva** — nenhuma tabela existente precisa ser alterada. Novas tabelas previstas:

- **`user_follows`** — `follower_id`, `followed_id`, `created_at`. PK composta.
- **`feed_items`** (opcional, denormalização para performance) — materialização do feed por usuário, derivada de `activity_events` dos seguidos.
- **`notifications`** — alertas de novos seguidores, curtidas, etc.
- **`comments`** — comentários em reviews (extensão de INT-04).

O feed da v2 lê de `activity_events` filtrando por `user_id IN (seguidos)` ordenado por `created_at DESC`. Se o volume crescer, materializa-se em `feed_items` via job assíncrono.

---

## Próximos passos

1. Criar models SQLAlchemy em `backend/app/modules/<dominio>/infrastructure/models.py` por módulo (`users` ✅, `games`, `interactions`, `lists`).
2. Gerar migrations com Alembic conforme cada módulo for sendo implementado.
3. Implementar helper de transação que escreve em estado + `activity_events` atomicamente.
4. Quando entrar a história de filtros, criar as tabelas normalizadas descritas em [Para a fase de filtros](#para-a-fase-de-filtros-deferido).
