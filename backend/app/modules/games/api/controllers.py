from fastapi import APIRouter, Depends, HTTPException, Query

from app.modules.games.api.dependencies import (
    get_add_game_to_collection_use_case,
    get_game_details_use_case,
    get_remove_game_from_collection_use_case,
    get_search_games_use_case,
    get_user_collection_use_case,
)
from app.modules.games.api.schemas import (
    AddToCollectionRequest,
    CollectionGameResponse,
    CollectionResponse,
    GameDetailResponse,
    GameSearchResponse,
    GameSearchResultResponse,
)
from app.modules.games.application.add_game_to_collection import AddGameToCollectionUseCase
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.get_user_collection import GetUserCollectionUseCase
from app.modules.games.application.remove_game_from_collection import RemoveGameFromCollectionUseCase
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.entities import UserGame
from app.modules.games.domain.exceptions import (
    GameAlreadyInCollection,
    GameNotFound,
    GameNotInCollection,
    GameProviderNotConfigured,
    GameProviderUnavailable,
)
from app.modules.users.api.dependencies import get_current_user
from app.modules.users.domain.entities import User

router = APIRouter(prefix="/games", tags=["games"])


def _to_collection_response(user_game: UserGame) -> CollectionGameResponse:
    return CollectionGameResponse(
        id=user_game.id,
        game_id=user_game.external_id,
        name=user_game.name,
        cover_url=user_game.cover_url,
        platforms=user_game.platforms,
        release_year=user_game.release_year,
    )


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
    current_user: User = Depends(get_current_user),
    use_case: GetUserCollectionUseCase = Depends(get_user_collection_use_case),
):
    items = use_case.execute(current_user.id)
    return CollectionResponse(items=[_to_collection_response(i) for i in items])


@router.post(
    "/want-to-play",
    status_code=201,
    response_model=CollectionGameResponse,
    response_model_by_alias=True,
)
def add_to_collection(
    payload: AddToCollectionRequest,
    current_user: User = Depends(get_current_user),
    use_case: AddGameToCollectionUseCase = Depends(get_add_game_to_collection_use_case),
):
    try:
        item = use_case.execute(user_id=current_user.id, external_id=payload.game_id)
    except GameAlreadyInCollection:
        raise HTTPException(status_code=409, detail="Game already in collection")
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found")
    except GameProviderUnavailable:
        raise HTTPException(status_code=502, detail="Game provider unavailable")
    except GameProviderNotConfigured:
        raise HTTPException(status_code=503, detail="Game provider not configured")
    return _to_collection_response(item)


@router.delete("/want-to-play/{game_id}", status_code=204)
def remove_from_collection(
    game_id: str,
    current_user: User = Depends(get_current_user),
    use_case: RemoveGameFromCollectionUseCase = Depends(get_remove_game_from_collection_use_case),
):
    try:
        use_case.execute(user_id=current_user.id, external_id=game_id)
    except GameNotInCollection:
        raise HTTPException(status_code=404, detail="Game not in collection")


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
