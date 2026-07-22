# Diagrama ER — Banco de Dados (estado atual)

Diagrama gerado a partir dos modelos SQLAlchemy e migrations Alembic do `backend/`.
Cole o bloco abaixo no [Mermaid Live Editor](https://mermaid.live) ou visualize direto no GitHub.

```mermaid
erDiagram
    users ||--o{ email_verification_tokens : "possui"
    users ||--o{ user_games : "coleciona"
    users ||--o{ game_lists : "cria"
    games ||--o{ user_games : "referenciado em"
    games ||--o{ game_list_items : "listado em"
    game_lists ||--o{ game_list_items : "contém"

    users {
        integer id PK
        varchar username UK "50, not null"
        varchar email UK "254, not null"
        varchar password_hash "255, nullable"
        boolean email_verified "not null, default false"
        varchar google_id UK "255, nullable"
        text bio "nullable"
        timestamptz created_at "not null"
        timestamptz updated_at "not null, onupdate"
    }

    email_verification_tokens {
        integer id PK
        integer user_id FK "not null, on delete cascade"
        varchar token_hash UK "255, not null"
        timestamptz expires_at "not null"
        timestamptz used_at "nullable"
        timestamptz created_at "not null"
    }

    games {
        bigint id PK
        varchar external_id "50, not null"
        varchar external_source "20, not null"
        varchar name "500, not null"
        text description "nullable"
        date release_date "nullable"
        text cover_url "nullable"
        jsonb genres "not null, default []"
        jsonb platforms "not null, default []"
        jsonb developers "not null, default []"
        jsonb screenshots "not null, default []"
        float rawg_rating "nullable"
        timestamptz cached_at "not null"
    }

    user_games {
        bigint id PK
        bigint user_id FK "not null, on delete cascade"
        bigint game_id FK "not null, on delete cascade"
        timestamptz added_at "not null"
        enum status "want_to_play | playing | finished"
        numeric rating "2,1 nullable"
        text review "nullable"
        timestamptz review_created_at "nullable"
        timestamptz review_updated_at "nullable"
    }

    game_lists {
        bigint id PK
        bigint user_id FK "not null, on delete cascade"
        varchar name "120, not null"
        text description "nullable"
        boolean is_public "not null, default false"
        timestamptz created_at "not null"
        timestamptz updated_at "not null, onupdate"
    }

    game_list_items {
        bigint id PK
        bigint list_id FK "not null, on delete cascade"
        bigint game_id FK "not null, on delete cascade"
        timestamptz added_at "not null"
    }
```

## Restrições de unicidade

| Tabela | Constraint | Colunas |
| --- | --- | --- |
| `users` | unique | `username`, `email`, `google_id` (individuais) |
| `email_verification_tokens` | unique | `token_hash` |
| `games` | `uq_games_external` | (`external_source`, `external_id`) |
| `user_games` | `uq_user_games_user_game` | (`user_id`, `game_id`) |
| `game_list_items` | `uq_game_list_items_list_game` | (`list_id`, `game_id`) |

## Índices adicionais

- `ix_user_games_user_id` em `user_games(user_id)`
- `ix_game_lists_user_id` em `game_lists(user_id)`
- `ix_game_list_items_list_id` em `game_list_items(list_id)`

## Observações

- Todas as FKs usam `ON DELETE CASCADE`: apagar um usuário remove seus tokens, jogos coletados e listas; apagar uma lista remove seus itens.
- `games` funciona como **cache** do provedor externo (RAWG): identificado por (`external_source`, `external_id`) e revalidado via `cached_at`.
- `user_games` concentra a relação usuário↔jogo — status na coleção, nota (`rating`) e review no mesmo registro (um por par usuário/jogo).
- Tipos `timestamptz` = `DateTime(timezone=True)`; `enum status` = tipo Postgres `user_game_status`.
</content>
</invoke>
