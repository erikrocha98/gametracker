from fastapi import APIRouter, Depends, HTTPException, Query

from app.modules.games.api.dependencies import get_search_games_use_case
from app.modules.games.api.schemas import GameSearchResponse, GameSearchResultResponse
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.exceptions import GameProviderNotConfigured, GameProviderUnavailable
from app.modules.users.api.dependencies import get_current_user
from app.modules.users.domain.entities import User

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/search", response_model=GameSearchResponse, response_model_by_alias=True)
def search_games(
    q: str = Query(..., min_length=1),
    _current_user: User = Depends(get_current_user),
    use_case: SearchGamesUseCase = Depends(get_search_games_use_case),
):
    try:
        results = use_case.execute(q)
    except GameProviderUnavailable:
        raise HTTPException(status_code=502, detail="Serviço de busca indisponível.")
    except GameProviderNotConfigured:
        raise HTTPException(status_code=503, detail="Serviço de busca não configurado.")

    return GameSearchResponse(
        results=[
            GameSearchResultResponse(
                id=r.id,
                name=r.name,
                coverUrl=r.cover_url,
                platforms=r.platforms,
                releaseYear=r.release_year,
            )
            for r in results
        ]
    )
