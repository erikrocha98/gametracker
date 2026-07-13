# Plano — Backend AUTH-01 (Cadastro com e-mail e senha)

## Contexto

O backend hoje é apenas `app/main.py` com FastAPI + CORS — não tem SQLAlchemy/Alembic configurado, não tem models, não tem rotas além de `/` e `/health`. O frontend (`SignUpForm`) já tem o formulário de cadastro com `react-hook-form` + `zod` fazendo `console.log` no submit; este ticket cobre o backend que ele vai consumir.

A modelagem v1 (`documentacao/modelagem-banco-v1.md`) já define as tabelas necessárias: `users` e `email_verification_tokens`. Esta iteração materializa apenas a parte dessas tabelas necessária para AUTH-01 — campos OAuth (`oauth_accounts`) ficam para AUTH-03.

## Critérios de aceite (do backlog AUTH-01)

- [x] Campos: username, email, senha, confirmar senha — `confirmar senha` é responsabilidade do frontend; backend recebe `password` único.
- [ ] Validação de formato de email — `EmailStr` do Pydantic (lib `email-validator`).
- [ ] Senha mínima de 8 caracteres.
- [ ] Username único no sistema.
- [ ] Envio de e-mail de verificação.

## Decisões (já alinhadas com o usuário)

| Decisão | Escolha | Motivação |
|---|---|---|
| Provider de e-mail | **Console logger** (loga o link de verificação no stdout) | Isolado atrás de uma interface `EmailSender`; trocar por SMTP/SES depois é um único arquivo novo. |
| Estrutura de módulo | **`modules/users/`** abriga signup, verify-email e (futuramente) login | Usuário é o agregado central; evita acoplamento entre módulos `auth` e `users`. |
| Login antes de verificar e-mail | **Permitido** | Verificação restringirá features sensíveis (review, lista) em tickets futuros; AUTH-01 só persiste `email_verified=false`. |
| Hash de senha | **bcrypt** via `passlib[bcrypt]`, cost factor padrão (12) | Projeto educacional com 8 GB de RAM; argon2id default usa 64 MB por hash. Trocar para argon2id depois é substituir o `pwd_context`. |
| Sync vs async | **SQLAlchemy 2.0 síncrono** | Sem carga real; reduz cerimônia. FastAPI executa rotas síncronas em threadpool. |
| DB de testes | **SQLite in-memory** | Models de AUTH-01 não usam JSONB; testes ficam rápidos e sem container. Migrations Alembic continuam apontando para Postgres. |

## Decisões técnicas adicionais (recomendação minha — confirmar se quiser mudar)

| Tema | Proposta |
|---|---|
| Regras de username | 3–30 caracteres, regex `^[a-zA-Z0-9_]+$`. Unicidade **case-insensitive** — armazena em lowercase. |
| Limite máximo de senha | 128 chars (defesa contra DoS de hash). |
| Complexidade de senha | Mínimo 8 chars + **pelo menos um caractere especial** (`[!@#$%^&*(),.?":{}|<>]` ou equivalente). Validado via regex no Pydantic. |
| Mensagens de conflito | **Específicas** (`"E-mail já cadastrado"`, `"Username já em uso"`). Produto não é de risco alto; UX > defesa contra enumeração nessa fase. |
| Token de verificação | `secrets.token_urlsafe(32)` (43 chars). Armazenado como `sha256(token)`. |
| TTL do token | **24 horas** (configurável via env). |
| Link de verificação | Aponta para o **frontend** (`{FRONTEND_BASE_URL}/verify-email?token=<token>`); o frontend chama o backend. |
| Resposta do `POST /auth/signup` | **201** com `{ id, username, email, email_verified, created_at }` — sem token de sessão (login é AUTH-02). |
| Reenvio de e-mail de verificação | **Fora de escopo** desta história (ticket futuro). |
| `activity_events` no signup | **Fora de escopo** — catálogo da modelagem não tem `user_created` e não há feed ainda. |

---

## Stack a adicionar em `backend/requirements.txt`

```
pydantic[email]>=2.0
pydantic-settings>=2.0
passlib[bcrypt]>=1.7
python-multipart>=0.0.9   # FastAPI form parsing (boa prática ter)
pytest>=8.0
pytest-mock>=3.12
httpx>=0.27               # TestClient do FastAPI
```

`sqlalchemy`, `alembic`, `psycopg2-binary` já estão.

---

## Estrutura de pastas final

```
backend/
├── alembic/
│   ├── versions/
│   │   └── <timestamp>_create_users_and_email_verification_tokens.py
│   ├── env.py
│   └── script.py.mako
├── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py                        # wire-up + inclui router de users
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                  # Settings (pydantic-settings)
│   │   ├── database.py                # engine, SessionLocal, Base, get_db
│   │   └── security.py                # hash_password, verify_password
│   └── modules/
│       └── users/
│           ├── __init__.py
│           ├── domain/
│           │   ├── __init__.py
│           │   ├── entities.py        # User (dataclass de domínio)
│           │   ├── exceptions.py      # UsernameAlreadyTaken, EmailAlreadyTaken,
│           │   │                      #   InvalidVerificationToken, ExpiredVerificationToken
│           │   ├── repositories.py    # UserRepository, EmailVerificationTokenRepository (Protocol)
│           │   └── email_sender.py    # EmailSender (Protocol)
│           ├── application/
│           │   ├── __init__.py
│           │   ├── signup_user.py     # SignUpUserUseCase
│           │   └── verify_email.py    # VerifyEmailUseCase
│           ├── api/
│           │   ├── __init__.py
│           │   ├── schemas.py         # Pydantic request/response
│           │   ├── controllers.py     # APIRouter("/auth")
│           │   └── dependencies.py    # get_signup_use_case, get_verify_email_use_case
│           └── infrastructure/
│               ├── __init__.py
│               ├── models.py          # SQLAlchemy UserModel, EmailVerificationTokenModel
│               ├── repositories.py    # SQLAlchemyUserRepository, SQLAlchemyEmailVerificationTokenRepository
│               └── email_sender_console.py  # ConsoleEmailSender
└── tests/
    ├── __init__.py
    ├── conftest.py                    # fixtures: db_session, client, fake repos
    └── modules/
        └── users/
            ├── application/
            │   ├── test_signup_user.py
            │   └── test_verify_email.py
            └── api/
                └── test_auth_routes.py
```

---

## Passo a passo

### 1. Dependências e settings

- Acrescentar pacotes em `requirements.txt` (lista acima), `pip install -r requirements.txt` dentro do `.venv`.
- Criar `app/core/config.py` com `Settings(BaseSettings)`:

```python
class Settings(BaseSettings):
    database_url: str
    frontend_base_url: str = "http://localhost:5173"
    email_verification_token_ttl_hours: int = 24
    bcrypt_rounds: int = 12

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

@lru_cache
def get_settings() -> Settings: ...
```

- Acrescentar ao `.env` raiz (não criar `.env.example` — diretriz de memória):

```
FRONTEND_BASE_URL=http://localhost:5173
EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24
```

### 2. SQLAlchemy + Alembic

- `app/core/database.py`:
  - `engine = create_engine(settings.database_url, pool_pre_ping=True)`
  - `SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)`
  - `Base = declarative_base()`
  - `get_db()` generator para usar como dependência FastAPI.
- `alembic init alembic` na raiz do `backend/`.
- Em `alembic/env.py`: importar `Base` e os models (`from app.modules.users.infrastructure.models import *`), setar `target_metadata = Base.metadata` e usar `settings.database_url`.
- Configurar `alembic.ini` com a connection string vinda do env (não hardcoded).

### 3. Models SQLAlchemy

`app/modules/users/infrastructure/models.py`:

- `UserModel` espelha a tabela `users` da modelagem v1 (apenas colunas usadas em AUTH-01: `id`, `username`, `email`, `password_hash`, `email_verified`, `created_at`, `updated_at`). Demais campos (`display_name`, `bio`, `avatar_url`) ficam para PRF-02.
- `EmailVerificationTokenModel` espelha `email_verification_tokens` integralmente.

### 4. Migration inicial

- `alembic revision --autogenerate -m "create users and email_verification_tokens"`.
- Revisar manualmente: garantir índices `UNIQUE(username)`, `UNIQUE(email)`, `UNIQUE(token_hash)` e FK `ON DELETE CASCADE`.
- Rodar `alembic upgrade head` apontando para o Postgres do `docker-compose`.

### 5. Camada de domínio — `modules/users/domain/`

- `entities.py`: dataclass `User` com campos do agregado (id, username, email, password_hash, email_verified, created_at, updated_at). Sem dependência de SQLAlchemy.
- `exceptions.py`: `UsernameAlreadyTaken`, `EmailAlreadyTaken`, `InvalidVerificationToken`, `ExpiredVerificationToken`, `UsedVerificationToken`.
- `repositories.py` (Protocols — contratos que os use cases dependem):
  ```python
  class UserRepository(Protocol):
      def get_by_username(self, username: str) -> User | None: ...
      def get_by_email(self, email: str) -> User | None: ...
      def get_by_id(self, user_id: int) -> User | None: ...
      def add(self, user: User) -> User: ...   # retorna com id populado
      def mark_email_verified(self, user_id: int) -> None: ...

  class EmailVerificationTokenRepository(Protocol):
      def add(self, user_id: int, token_hash: str, expires_at: datetime) -> None: ...
      def get_active_by_hash(self, token_hash: str) -> EmailVerificationToken | None: ...
      def mark_used(self, token_id: int) -> None: ...
  ```
- `email_sender.py` (Protocol):
  ```python
  class EmailSender(Protocol):
      def send_verification(self, *, to: str, link: str) -> None: ...
  ```

### 6. Camada api — `modules/users/api/`

- `schemas.py` (Pydantic v2):
  - `SignUpRequest { username: str (3-30, regex), email: EmailStr, password: str (8-128, pelo menos um caractere especial) }`
  - `SignUpResponse { id: int, username: str, email: EmailStr, email_verified: bool, created_at: datetime }`
  - `VerifyEmailRequest { token: str }`

### 7. Infraestrutura — `modules/users/infrastructure/`

- `repositories.py`: implementações SQLAlchemy de cada Protocol. Conversão `UserModel ↔ User` (domain) feita em métodos privados `_to_entity`/`_to_model`.
- `email_sender_console.py`:
  ```python
  class ConsoleEmailSender:
      def send_verification(self, *, to: str, link: str) -> None:
          logger.info("VERIFICATION_EMAIL to=%s link=%s", to, link)
  ```

### 8. Use cases

**`application/signup_user.py`** — `SignUpUserUseCase`:

1. Normaliza username para lowercase.
2. Valida unicidade via `get_by_username` / `get_by_email` → levanta `UsernameAlreadyTaken` / `EmailAlreadyTaken`.
3. Hash da senha via `core.security.hash_password`.
4. Cria `User` com `email_verified=False` e persiste via `user_repo.add`.
5. Gera token (`secrets.token_urlsafe(32)`), calcula `sha256` e salva em `email_verification_token_repo.add` com `expires_at = now + ttl`.
6. Monta link `{frontend_base_url}/verify-email?token=<token>` e envia via `email_sender.send_verification`.
7. Retorna o `User` recém-criado.

A inserção do user e do token deve estar na mesma transação (commit no final do use case).

**`application/verify_email.py`** — `VerifyEmailUseCase`:

1. Calcula `sha256(token)`.
2. `token_repo.get_active_by_hash` → se `None`: `InvalidVerificationToken`.
3. Se `used_at is not None`: `UsedVerificationToken`.
4. Se `expires_at < now`: `ExpiredVerificationToken`.
5. `user_repo.mark_email_verified(user_id)`.
6. `token_repo.mark_used(token_id)`.

### 9. Controllers / Rotas

`app/modules/users/api/controllers.py`:

```python
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", status_code=201, response_model=SignUpResponse)
def signup(payload: SignUpRequest, use_case: SignUpUserUseCase = Depends(...)):
    try:
        user = use_case.execute(...)
        return SignUpResponse.model_validate(user)
    except UsernameAlreadyTaken:
        raise HTTPException(409, detail="Username já em uso.")
    except EmailAlreadyTaken:
        raise HTTPException(409, detail="E-mail já cadastrado.")

@router.post("/verify-email", status_code=204)
def verify_email(payload: VerifyEmailRequest, use_case: VerifyEmailUseCase = Depends(...)):
    try:
        use_case.execute(payload.token)
    except InvalidVerificationToken:
        raise HTTPException(400, detail="Token inválido.")
    except ExpiredVerificationToken:
        raise HTTPException(400, detail="Token expirado.")
    except UsedVerificationToken:
        raise HTTPException(400, detail="Token já utilizado.")
```

`dependencies.py` monta a árvore: `get_db → repos → email_sender → use case`.

### 10. Wire-up no `main.py`

```python
from app.modules.users.api.controllers import router as users_router
app.include_router(users_router)
```

### 11. Testes

**Use cases (`tests/modules/users/application/`)** — usam fakes in-memory que implementam os Protocols. Sem banco, sem FastAPI:

- `test_signup_user.py`:
  - happy path: cria user, persiste, gera token, chama `email_sender` com link contendo token.
  - username duplicado → `UsernameAlreadyTaken`.
  - email duplicado → `EmailAlreadyTaken`.
  - username é normalizado para lowercase.
  - senha é hasheada (hash != senha em claro, `verify_password` confere).
- `test_verify_email.py`:
  - happy path: marca `email_verified=True` e `used_at` no token.
  - token desconhecido → `InvalidVerificationToken`.
  - token expirado → `ExpiredVerificationToken`.
  - token já usado → `UsedVerificationToken`.

**Rotas (`tests/modules/users/api/test_auth_routes.py`)** — `TestClient` + SQLite in-memory (override de `get_db`):

- `POST /auth/signup` válido → 201, payload correto, registro em DB.
- Senha < 8 chars → 422.
- E-mail inválido → 422.
- Username com caractere inválido → 422.
- Username duplicado → 409.
- E-mail duplicado → 409.
- `POST /auth/verify-email` com token válido → 204 e `email_verified=true` no DB.
- Token inválido/expirado/usado → 400 com mensagens distintas.

`conftest.py` provê fixtures `db_session`, `client` com override do `get_db`.

---

## Contratos de API (resumo)

### `POST /auth/signup`

Request:
```json
{ "username": "erikrocha", "email": "erik@example.com", "password": "minhasenha123" }
```

Respostas:
- `201 Created` → `{ "id": 1, "username": "erikrocha", "email": "erik@example.com", "email_verified": false, "created_at": "2026-05-18T..." }`
- `409 Conflict` → `{ "detail": "Username já em uso." }` ou `{ "detail": "E-mail já cadastrado." }`
- `422 Unprocessable Entity` → detalhes do Pydantic.

### `POST /auth/verify-email`

Request:
```json
{ "token": "abc123..." }
```

Respostas:
- `204 No Content`
- `400 Bad Request` → `{ "detail": "Token inválido." }` | `"Token expirado."` | `"Token já utilizado."`

---

## Fora de escopo (tickets futuros)

- Endpoint de **login** (AUTH-02) e geração de sessão/JWT.
- Vinculação **Google OAuth** (AUTH-03) — `oauth_accounts`.
- **Reset de senha** (AUTH-04) — `password_reset_tokens`.
- **Reenvio** de e-mail de verificação.
- Tabelas/colunas de perfil (`display_name`, `bio`, `avatar_url`) — PRF-02.
- Rate limiting nos endpoints de auth.
- Provider de e-mail real (SMTP/SES).
- Integração do frontend com `POST /auth/signup` (`SignUpForm` ainda faz `console.log`).

---

## Verificação manual após implementação

1. `docker-compose up -d db` e `alembic upgrade head` aplica a migration.
2. `uvicorn app.main:app --reload`.
3. `POST /auth/signup` com payload válido → 201; no log do uvicorn aparece `VERIFICATION_EMAIL to=... link=http://localhost:5173/verify-email?token=...`.
4. Pegar o token do log e `POST /auth/verify-email` → 204; `SELECT email_verified FROM users WHERE id=1` → `true`.
5. Re-enviar o mesmo token → 400 ("Token já utilizado.").
6. `pytest` — toda a suíte verde.
