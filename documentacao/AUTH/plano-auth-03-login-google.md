# Plano — AUTH-03: Login/Cadastro com Google

## Contexto

A história AUTH-03 pede que um visitante consiga entrar com Google ("Continuar com
Google"), com criação automática de conta no primeiro acesso e vinculação a uma
conta existente que tenha o mesmo e-mail.

Hoje o `GoogleButton` é apenas um placeholder (botão MUI sem ação). O backend já
tem toda a infraestrutura reaproveitável: autenticação por cookie JWT
(`create_access_token` + `response.set_cookie`), `password_hash` **nullable** no
modelo de usuário (suporta conta sem senha) e arquitetura limpa/modular no módulo
`modules/users/`.

**Decisões definidas com o usuário:**
- **Fluxo OAuth:** ID token via componente oficial `<GoogleLogin>` do
  `@react-oauth/google`. O backend valida o JWT assinado pelo Google **offline**
  (sem client secret, sem chamada de rede extra).
- **Username de contas auto-criadas:** derivado da parte local do e-mail
  (minúsculas, sem caracteres inválidos), com sufixo numérico em caso de colisão.

## Regra de negócio (use case `GoogleAuthUseCase`)

1. Validar o ID token → obter `sub`, `email`, `email_verified`, `name`.
2. Se `email_verified` for falso → rejeitar (impede sequestro de e-mail).
3. `get_by_google_id(sub)` achou → usuário Google recorrente → **login**.
4. Senão, `get_by_email(email)` achou → conta existente → **vincular**
   (`link_google_account`) e logar.
5. Senão → **criar conta**: username derivado do e-mail, `password_hash=None`,
   `email_verified=True`, `google_id=sub`.
6. Controller emite o cookie JWT (mesma lógica do `/auth/login`).

## Backend

### Banco de dados
- Adicionar coluna `google_id` em `users`: `String(255)`, **nullable**, **unique**
  (NULLs múltiplos são permitidos no Postgres — usuários atuais não quebram).
- Nova migração **escrita manualmente** em `backend/alembic/versions/`
  (`add_google_id_to_users`) — um `op.add_column` + índice único. Roda no
  `entrypoint.sh` via `alembic upgrade head`.

### Arquivos a modificar
- `app/core/config.py` — adicionar `google_client_id: str` ao `Settings`.
- `app/modules/users/domain/entities.py` — adicionar `google_id: str | None` ao
  dataclass `User`.
- `app/modules/users/domain/exceptions.py` — adicionar `InvalidGoogleToken`.
- `app/modules/users/domain/repositories.py` — adicionar à `UserRepository`:
  `get_by_google_id(google_id) -> User | None` e
  `link_google_account(user_id, google_id) -> None`.
- `app/modules/users/infrastructure/models.py` — adicionar coluna `google_id`.
- `app/modules/users/infrastructure/repositories.py` — implementar os dois
  métodos novos; incluir `google_id` em `add()` e em `_to_entity()`.
- `app/modules/users/api/schemas.py` — adicionar `GoogleAuthRequest`
  (`credential: str`). Reutilizar `LoginResponse`.
- `app/modules/users/api/controllers.py` — adicionar `POST /auth/google`
  (reaproveita `create_access_token` + `set_cookie` do `/login`; TTL padrão
  `jwt_access_ttl_hours`, sem "remember me").
- `app/modules/users/api/dependencies.py` — adicionar `get_google_auth_use_case`.
- `requirements.txt` — adicionar `google-auth>=2.0`.

### Arquivos novos (seguem o padrão de `email_sender.py` / `email_sender_console.py`)
- `app/modules/users/domain/google_identity.py` — Protocol `GoogleTokenVerifier`
  e dataclass `GoogleIdentity` (`sub`, `email`, `email_verified`, `name`).
- `app/modules/users/infrastructure/google_token_verifier.py` —
  `GoogleIdTokenVerifier`, usa `google.oauth2.id_token.verify_oauth2_token`
  (valida assinatura, `iss` e `aud == google_client_id`; converte `ValueError`
  em `InvalidGoogleToken`).
- `app/modules/users/application/google_auth.py` — `GoogleAuthUseCase` com a
  regra de negócio acima + geração de username (helper privado que consulta
  `get_by_username` para resolver colisões; trunca para caber em 50 chars).

## Frontend

### Configuração
- `package.json` — adicionar dependência `@react-oauth/google`.
- `vite.config.ts` — adicionar `envDir: '..'` para o Vite ler o `.env` da raiz
  (mantém um único `.env`; o Vite só expõe variáveis com prefixo `VITE_`).
- `.env` da raiz — adicionar `GOOGLE_CLIENT_ID` (backend) e
  `VITE_GOOGLE_CLIENT_ID` (frontend) — mesmo valor do Client ID público.

### Arquivos a modificar
- `src/main.tsx` — envolver a árvore com
  `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>`.
- `src/services/auth.ts` — adicionar
  `googleLogin = (credential) => http.post('/auth/google', { credential })`.
- `src/contexts/AuthContext.tsx` — adicionar `loginWithGoogle(credential)` ao
  contexto, espelhando o `login` atual (chama o serviço, seta `user` e `status`).
- `src/components/molecules/GoogleButton/GoogleButton.tsx` — substituir o botão
  MUI placeholder pelo componente `<GoogleLogin>` (`theme` escuro p/ combinar com
  a UI). Componente passa a ser **autossuficiente**: usa `useAuth()` +
  `useNavigate()` — no `onSuccess` chama `loginWithGoogle(credential)` e navega
  para `/`; no erro exibe um `<Alert>` inline. Isso evita prop drilling por
  AuthCard/LoginForm/SignUpForm, que continuam renderizando `<GoogleButton />`
  sem alteração.
- `src/components/molecules/GoogleButton/GoogleButton.test.tsx` — atualizar
  (mockar `@react-oauth/google`).

## Testes

- **Backend** (`backend/tests/`, espelhando a estrutura, com `pytest`):
  cobrir `GoogleAuthUseCase` — usuário Google recorrente, vinculação por e-mail,
  criação automática, colisão de username, token inválido, e-mail não verificado.
  Mockar `UserRepository` e `GoogleTokenVerifier`.
- **Frontend:** atualizar `GoogleButton.test.tsx` cobrindo render e callback de
  sucesso/erro.

## Pré-requisito externo (fora do código)

Criar um **OAuth 2.0 Client ID** (tipo "Web application") no Google Cloud
Console, com `http://localhost:5173` como *Authorized JavaScript origin*. O
Client ID resultante vai em `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`. No
fluxo de ID token **não é necessário** client secret.

## Verificação

1. Backend: rodar `pytest` em `backend/` — todos os testes de `GoogleAuthUseCase`
   passando.
2. Frontend: `npm run build` (type-check) e `npm run test`.
3. E2E manual com `docker-compose up`:
   - Acessar `/login`, clicar no botão do Google, escolher uma conta Google.
   - 1º acesso: conta criada (verificar no DBeaver: linha em `users` com
     `google_id` preenchido, `password_hash` nulo, username derivado do e-mail),
     redirecionado para `/`.
   - Logout e novo login com a mesma conta Google: entra direto (sem nova linha).
   - Vinculação: criar conta por e-mail/senha, depois logar com Google no mesmo
     e-mail → `google_id` é preenchido na linha existente (sem linha nova).

## Notas / fora de escopo

- O `<GoogleLogin>` é renderizado pelo Google (iframe), então não segue 100% o
  design system — `theme`/`size`/`shape` dão controle parcial. Foi a opção
  escolhida pela simplicidade e segurança no backend.
- A mensagem de erro do Google é texto de UI novo. O CLAUDE.md pede centralizar
  textos em `src/constants/texts.ts`, mas esse arquivo ainda não existe e o
  restante do código usa texto inline. Para manter consistência, o novo texto
  fica inline; a migração para `texts.ts`/`colors.ts` é trabalho separado.
- Login com Google não tem "remember me" (usa o TTL padrão de 12h).
