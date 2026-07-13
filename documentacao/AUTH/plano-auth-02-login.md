# Plano — AUTH-02 (Login com e-mail e senha)

## Contexto

AUTH-01 já entregou o backend de cadastro (`modules/users/`) com Clean Architecture,
hashing bcrypt (`core/security.py`) e os models `users` / `email_verification_tokens`.
O frontend tem `LoginForm` pronto (react-hook-form + zod) mas o `onSubmit` só faz
`console.log` — nenhuma chamada de API, nenhum estado de sessão, nenhuma página
autenticada existe ainda.

Esta história entrega o **fluxo de login de ponta a ponta**: endpoint de
autenticação no backend, emissão de JWT, persistência de sessão segura no navegador,
e a integração completa do frontend (contexto de auth, rota protegida e uma página
autenticada mínima para validar o fluxo).

## Critérios de aceite (do backlog AUTH-02)

- [ ] Campos: email e senha.
- [ ] Mensagem de erro **genérica** (não revelar se o e-mail existe ou se a senha está errada).
- [ ] Geração de **token JWT**.
- [ ] Opção **"Lembrar de mim"**.

## Decisões alinhadas com o usuário

| Tema | Escolha | Motivação |
|---|---|---|
| Armazenamento do token | **JWT único em cookie `httpOnly` + `Secure` + `SameSite`** | `localStorage` é legível por JS → exfiltrável via XSS. Cookie `httpOnly` nunca é exposto ao JS. Sem refresh token: mais simples (sem tabela nem endpoint extra). |
| Revogação de sessão | **Não há revogação server-side** | Consequência aceita do JWT stateless. Logout apenas apaga o cookie. Mitigado por TTL curto no modo padrão. |
| "Lembrar de mim" | **Controla o `Max-Age` do cookie e o `exp` do JWT** | Marcado → 30 dias. Desmarcado → cookie de sessão (morre ao fechar o navegador) + `exp` de 12h. |
| Escopo de frontend | **Integração completa** | `AuthContext`, `ProtectedRoute`, redirect pós-login e ligação do `LoginForm` à API. |
| Destino pós-login | **Página placeholder mínima** | Rota `/` autenticada com saudação + botão de logout, só para validar o fluxo. |
| Brute-force / rate limiting | **Fora de escopo** | Consistente com AUTH-01. Mitigações já presentes: mensagem genérica + bcrypt (hashing lento). Registrado como follow-up. |
| Gate de e-mail verificado | **Login permitido sem e-mail verificado** | Mantém a decisão de AUTH-01; restrições por verificação ficam para tickets futuros. |

## Decisões técnicas adicionais (recomendação — confirmar se quiser mudar)

| Tema | Proposta |
|---|---|
| Algoritmo do JWT | **HS256** (segredo simétrico). Suficiente para um único serviço; sem necessidade de par de chaves. |
| Claims do JWT | `sub` (user id), `iat`, `exp`. Mínimo necessário — sem dados sensíveis no payload. |
| Segredo do JWT | Variável de ambiente `JWT_SECRET` (obrigatória, sem default). Aplicação falha no boot se ausente. |
| Nome do cookie | `access_token`. |
| Flags do cookie | `httpOnly=True`, `Secure=True` (configurável via `COOKIE_SECURE` p/ ambientes sem HTTPS), `SameSite=Lax`, `Path=/`. |
| CSRF | `SameSite=Lax` já bloqueia envio cross-site em requisições "perigosas". Front e back são same-site (`localhost`), então o cookie funciona. Token anti-CSRF dedicado fica como follow-up (relevante só se em produção os domínios forem diferentes). |
| Endpoint `/auth/me` | Necessário: como o JS **não** consegue ler o cookie `httpOnly`, o frontend descobre se está logado perguntando ao backend (no boot e após reload). |
| Resposta do `/auth/login` | `200` com `{ id, username, email, email_verified }` no body **e** o cookie setado no header. Evita um `/auth/me` extra logo após o login. |
| Mensagem de erro genérica | `401` com `{ "detail": "E-mail ou senha inválidos." }` — idêntico para e-mail inexistente e senha errada. |
| Defesa contra timing / enumeração | Quando o e-mail não existe, ainda assim executar um `verify_password` contra um hash dummy fixo, para que o tempo de resposta não denuncie a existência da conta. |
| Validação de input | `email: EmailStr`; `password: str` (1–128 chars). Sem regras de complexidade no login (complexidade é do cadastro). |

---

## Stack a adicionar

`backend/requirements.txt`:

```
pyjwt>=2.8
```

Frontend: nenhuma dependência nova (`react-router-dom` já presente).

`.env` (raiz — acrescentar ao arquivo existente, sem criar `.env.example`):

```
JWT_SECRET=<gerar com: python -c "import secrets; print(secrets.token_urlsafe(48))">
JWT_ACCESS_TTL_HOURS=12
JWT_REMEMBER_ME_TTL_DAYS=30
COOKIE_SECURE=true
```

---

## Backend — passo a passo

### 1. Settings e segurança

- `app/core/config.py` — acrescentar a `Settings`:
  `jwt_secret: str`, `jwt_access_ttl_hours: int = 12`,
  `jwt_remember_me_ttl_days: int = 30`, `cookie_secure: bool = True`.
- `app/core/security.py` — acrescentar:
  - `create_access_token(user_id: int, expires_delta: timedelta) -> str` — codifica HS256.
  - `decode_access_token(token: str) -> int` — decodifica e devolve o `sub`; levanta exceção em token inválido/expirado.
  - `_DUMMY_PASSWORD_HASH` — um hash bcrypt fixo usado para o `verify_password` defensivo quando o e-mail não existe.

### 2. Domínio — `modules/users/domain/`

- `exceptions.py` — acrescentar `InvalidCredentials`.
- `repositories.py` — `UserRepository.get_by_email` já existe; nada novo.

### 3. Use case — `modules/users/application/login_user.py`

`LoginUserUseCase`:

1. Busca usuário por e-mail (`user_repo.get_by_email`).
2. Se não existir → executa `verify_password` contra `_DUMMY_PASSWORD_HASH` (constant-time defensivo) → levanta `InvalidCredentials`.
3. Se existir mas `password_hash` for `None` (conta só-OAuth, futura AUTH-03) → `InvalidCredentials`.
4. `verify_password(password, user.password_hash)` falso → `InvalidCredentials`.
5. Sucesso → retorna a entidade `User` (a emissão do JWT fica no controller, que sabe o `remember_me`).

> O use case **não** mexe em JWT/cookie — isso é detalhe de transporte (camada `api`). O use case só valida credenciais.

### 4. Schemas — `modules/users/api/schemas.py`

- `LoginRequest { email: EmailStr, password: str (1–128), remember_me: bool = False }`
- `LoginResponse { id, username, email, email_verified }` (`from_attributes`).
- `MeResponse` — pode reusar `LoginResponse`.

### 5. Dependência de autenticação — `modules/users/api/dependencies.py`

- `get_login_use_case(db)` — monta `LoginUserUseCase`.
- `get_current_user(request, db)` — lê o cookie `access_token`, decodifica via `decode_access_token`, busca o usuário; levanta `401` se ausente/inválido. Será a dependência reutilizável para proteger rotas.

### 6. Controllers — `modules/users/api/controllers.py`

```
POST /auth/login    -> valida credenciais, seta cookie access_token, 200 + LoginResponse
POST /auth/logout   -> apaga o cookie, 204
GET  /auth/me       -> Depends(get_current_user), 200 + MeResponse
```

- `/auth/login`: calcula `expires_delta` conforme `remember_me`
  (`jwt_remember_me_ttl_days` vs `jwt_access_ttl_hours`), gera o JWT,
  chama `response.set_cookie(...)` com as flags. Cookie de sessão quando
  `remember_me=False` (sem `max_age`/`expires`); persistente quando `True`.
- `InvalidCredentials` → `HTTPException(401, "E-mail ou senha inválidos.")`.
- `/auth/logout`: `response.delete_cookie("access_token", ...)` com os mesmos atributos.

### 7. Testes — `backend/tests/`

`tests/modules/users/application/test_login_user.py` (fakes in-memory, sem DB):
- happy path: credenciais corretas retornam o `User`.
- e-mail inexistente → `InvalidCredentials`.
- senha errada → `InvalidCredentials`.
- conta com `password_hash=None` → `InvalidCredentials`.

`tests/modules/users/api/test_auth_routes.py` (TestClient + SQLite, acrescentar):
- `POST /auth/login` válido → 200, body correto, cookie `access_token` presente.
- `remember_me=True` → cookie com `Max-Age`/`Expires`; `False` → cookie de sessão.
- e-mail inexistente e senha errada → **ambos** 401 com a **mesma** mensagem.
- e-mail malformado / senha vazia → 422.
- `GET /auth/me` com cookie válido → 200; sem cookie → 401; cookie adulterado → 401.
- `POST /auth/logout` → 204 e cookie expirado no response.

### 8. Helper de teste para JWT

Em `core/security.py` os TTLs vêm de `Settings`; nos testes, injetar um
`JWT_SECRET` fixo via fixture de ambiente no `conftest.py`.

---

## Frontend — passo a passo

### 1. Camada de API — `src/services/`

- `src/services/http.ts` — wrapper `fetch` com `credentials: 'include'`
  (essencial: sem isso o navegador não envia/recebe o cookie) e `baseURL`
  `http://localhost:8000`.
- `src/services/auth.ts` — `login(data)`, `logout()`, `getMe()`.

### 2. Contexto de autenticação — `src/contexts/AuthContext.tsx`

- Estado: `user: User | null`, `status: 'loading' | 'authenticated' | 'guest'`.
- No mount: chama `getMe()` para reidratar a sessão a partir do cookie
  (necessário porque o JS não lê o cookie `httpOnly`).
- Expõe `login()`, `logout()`, `user`.
- Provider montado em `main.tsx` (ou em volta de `AppRoutes`).

### 3. Rota protegida — `src/routes/ProtectedRoute.tsx`

- `status === 'loading'` → spinner/placeholder.
- `status === 'guest'` → `<Navigate to="/login" replace />`.
- `status === 'authenticated'` → renderiza a rota.

### 4. Página autenticada placeholder — `src/components/pages/HomePage/`

- Saudação `Olá, {username}` + botão **Sair** que chama `logout()` e redireciona para `/login`.
- Atomic Design + MUI + styled-components, conforme o CLAUDE.md.

### 5. Integração do `LoginForm`

- `LoginForm` — acrescentar checkbox **"Lembrar de mim"** (`Checkbox` do MUI)
  registrado no `react-hook-form`; incluir `remember_me` no `loginSchema`.
- `LoginPage` / `AuthCard` — `onSubmit` chama `auth.login()` do contexto:
  - sucesso → redireciona para `/`.
  - `401` → exibe erro genérico **"E-mail ou senha inválidos."** (não por campo).
  - erro de rede → mensagem genérica de falha.
- Estado de carregamento: desabilitar o botão "Entrar" durante a requisição.

### 6. Rotas — `src/routes/AppRoutes.tsx`

```
/login    -> LoginPage   (pública)
/signup   -> SignUpPage  (pública)
/         -> HomePage    (dentro de <ProtectedRoute>)
*         -> Navigate para /
```

### 7. Testes (Vitest + Testing Library)

- `LoginForm` — renderiza checkbox "Lembrar de mim"; submit chama `onSubmit` com `remember_me`.
- `ProtectedRoute` — redireciona convidado para `/login`; renderiza filho quando autenticado.
- `HomePage` — mostra o username; botão "Sair" chama `logout`.
- `AuthContext` — `getMe` mockado: transita `loading → authenticated/guest`.
- `LoginPage` — login com erro 401 mostra a mensagem genérica.

---

## Contratos de API (resumo)

### `POST /auth/login`

Request: `{ "email": "erik@example.com", "password": "...", "remember_me": true }`

Respostas:
- `200 OK` → body `{ id, username, email, email_verified }` + `Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax`.
- `401 Unauthorized` → `{ "detail": "E-mail ou senha inválidos." }` (idêntico para e-mail inexistente e senha errada).
- `422` → erro de validação do Pydantic.

### `GET /auth/me`

- `200 OK` → `{ id, username, email, email_verified }`.
- `401 Unauthorized` → cookie ausente, inválido ou expirado.

### `POST /auth/logout`

- `204 No Content` → cookie `access_token` apagado.

---

## Notas de segurança

| Ameaça | Mitigação nesta história |
|---|---|
| XSS exfiltrando o token | Cookie `httpOnly` — inacessível ao JS. |
| Interceptação em trânsito | Flag `Secure` (cookie só vai por HTTPS; `localhost` é contexto seguro). |
| CSRF | `SameSite=Lax` + front/back same-site. Token anti-CSRF dedicado = follow-up. |
| Enumeração de contas | Mensagem de erro genérica + `verify_password` dummy no caminho "e-mail não existe" (defesa de timing). |
| Brute-force | **Fora de escopo** — mitigado parcialmente por bcrypt. Follow-up: rate limiting. |
| Vazamento do segredo JWT | `JWT_SECRET` só em env, nunca versionado; app falha no boot se ausente. |

---

## Fora de escopo (follow-ups)

- Rate limiting / bloqueio por brute-force no login.
- Refresh token e revogação server-side de sessão.
- Token anti-CSRF dedicado (necessário se em produção os domínios divergirem).
- Google OAuth (AUTH-03) — login de conta só-OAuth (`password_hash = NULL`).
- Reset de senha (AUTH-04).
- Restrição de features para contas com e-mail não verificado.

---

## Verificação manual após implementação

1. `docker-compose up -d db`, `alembic upgrade head`, `uvicorn app.main:app --reload`.
2. `npm run dev` no frontend.
3. Cadastrar um usuário (AUTH-01) ou usar um existente.
4. Login com senha errada → mensagem genérica "E-mail ou senha inválidos.".
5. Login com e-mail inexistente → **mesma** mensagem, tempo de resposta similar.
6. Login válido **sem** "Lembrar de mim" → redireciona para `/`; no DevTools, cookie `access_token` é de sessão (sem `Expires`). Fechar e reabrir o navegador → deslogado.
7. Login válido **com** "Lembrar de mim" → cookie com `Expires` ~30 dias; reabrir o navegador → continua logado.
8. Confirmar no DevTools que o cookie tem `HttpOnly` e que `document.cookie` no console **não** o mostra.
9. Acessar `/` sem cookie → redireciona para `/login`.
10. Botão "Sair" → cookie removido, redireciona para `/login`.
11. `pytest` (backend) e `npm test` (frontend) — suítes verdes.
