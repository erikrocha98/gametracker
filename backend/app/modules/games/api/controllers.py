from fastapi import APIRouter, Depends, HTTPException, Query

from app.modules.games.api.dependencies import get_game_details_use_case, get_search_games_use_case
from app.modules.games.api.schemas import (
    CollectionResponse,
    GameDetailResponse,
    GameSearchResponse,
    GameSearchResultResponse,
)
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.exceptions import GameNotFound, GameProviderNotConfigured, GameProviderUnavailable
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


@router.get("/collection", response_model=CollectionResponse, response_model_by_alias=True)
def get_collection(
    _current_user: User = Depends(get_current_user),
):
    return CollectionResponse(items=[])


@router.get("/{game_id}", response_model=GameDetailResponse, response_model_by_alias=True)
def get_game_details(
    game_id: str,
    _current_user: User = Depends(get_current_user),
    use_case: GetGameDetailsUseCase = Depends(get_game_details_use_case),
):
    try:
        detail = use_case.execute(game_id)
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found")
    except GameProviderUnavailable:
        raise HTTPException(status_code=502, detail="Game provider unavailable")
    except GameProviderNotConfigured:
        raise HTTPException(status_code=503, detail="Game provider not configured")

    return GameDetailResponse(
        id=detail.id,
        name=detail.name,
        description=detail.description,
        releaseDate=detail.release_date,
        coverUrl=detail.cover_url,
        genres=detail.genres,
        platforms=detail.platforms,
        developers=detail.developers,
        platform_average_rating=None,
        rawgRating=detail.rawg_rating,
        screenshots=detail.screenshots,
    )
