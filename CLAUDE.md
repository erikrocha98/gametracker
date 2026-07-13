# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Monorepo with two independent services:

- **`backend/`** — Python FastAPI REST API, runs on `http://localhost:8000`
- **`frontend/`** — React 19 + TypeScript + Vite SPA, runs on `http://localhost:5173`

CORS is configured on the backend to allow only `http://localhost:5173`.

## General conventions

- **No unnecessary comments** — do not add comments that merely restate what the code already says. Code should be self-explanatory through clear naming. Reserve comments for genuinely complex or non-obvious logic (tricky algorithms, subtle edge cases, workarounds), explaining the *why*, not the *what*. This applies to both backend and frontend.

## Backend

Uses a local virtualenv at `backend/.venv/`. Always activate it before running Python commands.

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload   # dev server with hot reload
```

Add dependencies to `requirements.txt`, then install with `pip install -r requirements.txt`.

App entry point: `backend/app/main.py` — the `FastAPI` app instance is `app`.

### Conventions

- **Naming** — all identifiers (variables, functions, classes, files, modules) must be in English.
- Follow REST API standards: proper HTTP verbs (GET, POST, PUT/PATCH, DELETE), meaningful resource-based URL paths, and appropriate status codes.
- **Clean Architecture + Modular Architecture** — business domains are separated into self-contained modules (e.g. `modules/games/`, `modules/users/`). Each module follows clean architecture layers internally: `domain/` (entities and business rules), `use_cases/` (application logic), `interfaces/` (controllers and repository interfaces), `infrastructure/` (database and external services). No outer layer may be imported by an inner layer, and modules must not import from each other directly.
- **Unit tests** — every feature must have unit tests covering its main behavior. Tests live in `backend/tests/` mirroring the source structure. Use `pytest` as the test runner. Use fakes (in-memory implementations) instead of mocks or real infrastructure. Integration tests (real database, real HTTP calls) are out of scope for now — do not create them.

### Database

- **PostgreSQL** — primary database. Connection configured via environment variables.
- **SQLAlchemy** — ORM for all database access; raw SQL is not used.
- **Alembic** — handles schema migrations. Migration files live in `backend/alembic/`.

### Infrastructure

- **Local** — run the full stack (API + database) with `docker-compose up` from the repo root.
- **Cloud** — deployment targets AWS; infrastructure details live in the `infra/` directory.

## Frontend

```bash
cd frontend
npm run dev      # dev server (HMR)
npm run build    # type-check then bundle
npm run lint     # ESLint
npm run preview  # serve production build locally
```

No test runner is configured yet. TypeScript strict mode is not enabled by default; tsconfig splits into `tsconfig.app.json` (src) and `tsconfig.node.json` (vite config).

### Conventions

- **Naming** — all identifiers (variables, functions, hooks, files, folders) must be in English. Route paths must also be in English (e.g. `/profile`, `/add-game`, not `/perfil`, `/adicionar`).
- **Atomic Design** — organize components into `atoms/`, `molecules/`, `organisms/`, `templates/`, and `pages/` under `src/components/`.
- **Styling** — Material UI as the component library; use `styled-components` for custom styling (no plain CSS modules or inline styles).
- **Performance** — wrap expensive computations in `useMemo` and stable callbacks passed as props in `useCallback`; apply only where there is a real cost, not by default.
- **Tests** — every component must have at least one test covering its essential behavior; full coverage is not required. Always write and review component tests using the `test-skill` skill (invoke via `/test-skill`).
- **No hardcoded colors** — never use raw color values (e.g. `'#22c55e'`, `'rgba(...)'`) directly in components or styled-components. Always reference tokens from `src/theme/colors.ts`, which exports named constants (e.g. `colors.primary`, `colors.backgroundPaper`). The MUI theme in `src/theme/theme.ts` must also consume these constants instead of literal strings.
- **No hardcoded UI text** — never write user-visible strings (labels, placeholders, error messages, button text, page titles) directly inside components. Centralise all copy in `src/constants/texts.ts`, organised by feature/component (e.g. `texts.auth.loginButton`, `texts.auth.emailPlaceholder`). Components must import and use these constants.

## Commit messages

Ao final de cada implementação, forneça uma sugestão de mensagem de commit em inglês seguindo o **Conventional Commits**:

- `feat` — nova funcionalidade
- `fix` — correção de bug
- `docs` — alterações em documentação e READMEs
- `style` — formatação, espaçamento (sem mudança de lógica)
- `refactor` — refatoração sem adição de feature nem correção de bug
- `test` — adição ou correção de testes
- `chore` — tarefas de build, configs, dependências

Formato: `<type>(<optional scope>): <short description in lowercase>`

Exemplo: `feat(auth): add login endpoint with jwt cookie`

---

## Workflow de planejamento

Sempre que o usuário pedir um **planejamento de execução** (ex.: "planeje a implementação de X"), siga este fluxo:

1. Explore o código existente para entender o contexto.
2. Escreva o plano em um arquivo `.md` dentro da pasta `documentacao/` com o escopo no nome: `plano-backend-nome-da-feature.md` ou `plano-frontend-nome-da-feature.md`. Se o plano envolver ambos, use `plano-fullstack-nome-da-feature.md`.
3. **Não inicie nenhuma implementação.** Aguarde o usuário ler o arquivo e confirmar explicitamente que quer começar.
4. Só implemente após o usuário aprovar o plano.

