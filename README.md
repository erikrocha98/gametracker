# GameTracker

A personal game tracking app where you can log, rate, and review games from your library — keeping a history of everything you've played, are playing, or want to play.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) 20+ (for the frontend)
- [Python](https://www.python.org/) 3.12+ (for running backend outside Docker)

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd gametracker
```

### 2. Configure environment variables

Copy the required variables into a `.env` file at the project root:

```bash
# Database
POSTGRES_DB=gametracker
POSTGRES_USER=gametracker
POSTGRES_PASSWORD=your_password_here

# App
DATABASE_URL=postgresql://gametracker:your_password_here@db:5432/gametracker
FRONTEND_BASE_URL=http://localhost:5173
JWT_ACCESS_TTL_HOURS=12
JWT_REMEMBER_ME_TTL_DAYS=30
COOKIE_SECURE=false

# Google OAuth (optional — needed for Google login)
GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Start the backend + database

```bash
docker-compose up --build
```

This starts PostgreSQL on port `5432` and the FastAPI server on port `8000`. Database migrations run automatically on container start.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Running tests

**Backend:**

```bash
cd backend
source .venv/bin/activate
pytest
```

**Frontend:**

```bash
cd frontend
npm run test
```

---

## Project structure

```
gametracker/
├── backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── core/             # Shared config, dependencies, security
│   │   ├── modules/          # Feature modules (Clean Architecture)
│   │   │   └── users/
│   │   │       ├── api/          # Route handlers (controllers)
│   │   │       ├── application/  # Use cases
│   │   │       ├── domain/       # Entities and business rules
│   │   │       └── infrastructure/ # SQLAlchemy models, repositories
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # Database migrations
│   ├── tests/                # Unit tests (mirrors src structure)
│   └── requirements.txt
│
├── frontend/                 # React SPA
│   └── src/
│       ├── components/       # Atomic Design hierarchy
│       │   ├── atoms/
│       │   ├── molecules/
│       │   ├── organisms/
│       │   ├── templates/
│       │   └── pages/
│       ├── constants/        # UI text copy (texts.ts) and config
│       ├── contexts/         # React contexts (auth, etc.)
│       ├── routes/           # React Router route definitions
│       ├── services/         # API client calls
│       └── theme/            # MUI theme and color tokens
│
├── documentacao/             # Planning docs and DB model
├── docker-compose.yml        # Local dev stack (API + PostgreSQL)
└── .env                      # Environment variables (not committed)
```

### Architecture overview

The backend follows **Clean Architecture** within each feature module — domain and use case layers have no knowledge of infrastructure or HTTP concerns. Modules are fully isolated from each other.

The frontend follows **Atomic Design**, using Material UI as the component library and styled-components for custom styling. All user-visible strings live in `src/constants/texts.ts` and all color values in `src/theme/colors.ts`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Material UI, styled-components |
| Forms | React Hook Form, Zod |
| Backend | Python, FastAPI |
| Database | PostgreSQL 16, SQLAlchemy, Alembic |
| Auth | JWT (HTTP-only cookies), Google OAuth 2.0 |
| Testing | Vitest + Testing Library (frontend), Pytest (backend) |
| Infrastructure | Docker Compose, AWS (production) |

---

## Roadmap

- [ ] **Game catalog** — search and browse games via IGDB/RAWG integration
- [ ] **Game status tracking** — mark games as Playing, Played, Want to Play, or Abandoned
- [ ] **Ratings** — score games on a 0.5–5.0 scale
- [ ] **Reviews** — write and read reviews per game (with spoiler toggle)
- [ ] **Custom lists** — create and share curated game lists
- [ ] **User profile** — display stats, activity, and lists publicly
- [ ] **Activity feed** — timeline of your interactions and those of people you follow
- [ ] **Social features** *(v2)* — follow other users, like reviews, comment threads
- [ ] **Analytics** *(v2)* — trending games, top-rated titles, platform insights
