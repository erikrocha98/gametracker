from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.games.api.controllers import router as games_router
from app.modules.users.api.controllers import router as users_router

app = FastAPI(title="GameTracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(games_router)


@app.get("/")
def root():
    return {"message": "GameTracker API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
