# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Monorepo with two independent services:

- **`backend/`** — Python FastAPI REST API, runs on `http://localhost:8000`
- **`frontend/`** — React 19 + TypeScript + Vite SPA, runs on `http://localhost:5173`

CORS is configured on the backend to allow only `http://localhost:5173`.

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

- Follow REST API standards: proper HTTP verbs (GET, POST, PUT/PATCH, DELETE), meaningful resource-based URL paths, and appropriate status codes.

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

- **Atomic Design** — organize components into `atoms/`, `molecules/`, `organisms/`, `templates/`, and `pages/` under `src/components/`.
- **Styling** — Material UI as the component library; use `styled-components` for custom styling (no plain CSS modules or inline styles).
- **Tests** — every component must have at least one test covering its essential behavior; full coverage is not required.

