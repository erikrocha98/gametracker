from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.modules.game_lists.api.dependencies import (
    get_add_game_to_list_use_case,
    get_create_game_list_use_case,
    get_delete_game_list_use_case,
    get_list_games_use_case,
    get_remove_game_from_list_use_case,
    get_update_game_list_use_case,
    get_user_lists_use_case,
)
from app.modules.game_lists.api.schemas import (
    AddGameToListRequest,
    CreateGameListRequest,
    GameListDetailResponse,
    GameListResponse,
    GameListsResponse,
    ListGameResponse,
    UpdateGameListRequest,
)
from app.modules.game_lists.application.add_game_to_list import AddGameToListUseCase
from app.modules.game_lists.application.delete_game_list import DeleteGameListUseCase
from app.modules.game_lists.application.get_list_games import GetListGamesUseCase
from app.modules.game_lists.application.get_user_lists import GetUserListsUseCase
from app.modules.game_lists.application.remove_game_from_list import RemoveGameFromListUseCase
from app.modules.game_lists.application.update_game_list import UpdateGameListUseCase
from app.modules.game_lists.application.create_game_list import CreateGameListUseCase
from app.modules.game_lists.domain.entities import GameList, GameListPreview, ListedGame
from app.modules.game_lists.domain.exceptions import (
    GameAlreadyInList,
    GameListFull,
    GameListNotFound,
    GameNotInList,
)
from app.modules.games.domain.exceptions import (
    GameNotFound,
    GameProviderNotConfigured,
    GameProviderUnavailable,
)
from app.modules.users.api.dependencies import get_current_user
from app.modules.users.domain.entities import User

router = APIRouter(prefix="/lists", tags=["lists"])

_ERR_LIST_NOT_FOUND = "List not found"
_ERR_GAME_NOT_FOUND = "Game not found"
_ERR_PROVIDER_UNAVAILABLE = "Game provider unavailable"
_ERR_PROVIDER_NOT_CONFIGURED = "Game provider not configured"


def _preview_to_response(preview: GameListPreview) -> GameListResponse:
    gl = preview.game_list
    return GameListResponse(
        id=gl.id,
        name=gl.name,
        description=gl.description,
        is_public=gl.is_public,
        created_at=gl.created_at,
        updated_at=gl.updated_at,
        game_count=preview.game_count,
        cover_urls=preview.cover_urls,
        contains_game=preview.contains_game,
    )


def _listed_game_to_response(game: ListedGame) -> ListGameResponse:
    return ListGameResponse(
        game_id=game.game_id,
        name=game.name,
        cover_url=game.cover_url,
        platforms=game.platforms,
        release_year=game.release_year,
        added_at=game.added_at,
    )


@router.post("", status_code=201, response_model=GameListResponse, response_model_by_alias=True)
def create_list(
    payload: CreateGameListRequest,
    current_user: User = Depends(get_current_user),
    use_case: CreateGameListUseCase = Depends(get_create_game_list_use_case),
):
    item = use_case.execute(
        user_id=current_user.id, name=payload.name, description=payload.description
    )
    return _preview_to_response(GameListPreview(game_list=item, game_count=0))


@router.get("", response_model=GameListsResponse, response_model_by_alias=True)
def get_lists(
    game_id: str | None = Query(None, alias="gameId"),
    current_user: User = Depends(get_current_user),
    use_case: GetUserListsUseCase = Depends(get_user_lists_use_case),
):
    previews = use_case.execute(current_user.id, contains_external_id=game_id)
    return GameListsResponse(items=[_preview_to_response(p) for p in previews])


@router.get("/{list_id}", response_model=GameListDetailResponse, response_model_by_alias=True)
def get_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    use_case: GetListGamesUseCase = Depends(get_list_games_use_case),
):
    try:
        game_list, games = use_case.execute(user_id=current_user.id, list_id=list_id)
    except GameListNotFound:
        raise HTTPException(status_code=404, detail=_ERR_LIST_NOT_FOUND)
    return GameListDetailResponse(
        id=game_list.id,
        name=game_list.name,
        description=game_list.description,
        is_public=game_list.is_public,
        created_at=game_list.created_at,
        updated_at=game_list.updated_at,
        game_count=len(games),
        items=[_listed_game_to_response(g) for g in games],
    )


@router.put("/{list_id}", response_model=GameListResponse, response_model_by_alias=True)
def update_list(
    list_id: int,
    payload: UpdateGameListRequest,
    current_user: User = Depends(get_current_user),
    use_case: UpdateGameListUseCase = Depends(get_update_game_list_use_case),
):
    try:
        item = use_case.execute(
            user_id=current_user.id,
            list_id=list_id,
            name=payload.name,
            description=payload.description,
        )
    except GameListNotFound:
        raise HTTPException(status_code=404, detail=_ERR_LIST_NOT_FOUND)
    return _preview_to_response(GameListPreview(game_list=item, game_count=0))


@router.delete("/{list_id}", status_code=204)
def delete_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    use_case: DeleteGameListUseCase = Depends(get_delete_game_list_use_case),
):
    try:
        use_case.execute(user_id=current_user.id, list_id=list_id)
    except GameListNotFound:
        raise HTTPException(status_code=404, detail=_ERR_LIST_NOT_FOUND)


@router.post(
    "/{list_id}/games",
    status_code=201,
    response_model=ListGameResponse,
    response_model_by_alias=True,
)
def add_game_to_list(
    list_id: int,
    payload: AddGameToListRequest,
    current_user: User = Depends(get_current_user),
    use_case: AddGameToListUseCase = Depends(get_add_game_to_list_use_case),
):
    try:
        game = use_case.execute(
            user_id=current_user.id,
            list_id=list_id,
            external_id=payload.game_id,
        )
    except GameListNotFound:
        raise HTTPException(status_code=404, detail=_ERR_LIST_NOT_FOUND)
    except GameNotFound:
        raise HTTPException(status_code=404, detail=_ERR_GAME_NOT_FOUND)
    except GameAlreadyInList:
        raise HTTPException(status_code=409, detail="Game already in list")
    except GameListFull:
        raise HTTPException(status_code=422, detail="List is full")
    except GameProviderUnavailable:
        raise HTTPException(status_code=502, detail=_ERR_PROVIDER_UNAVAILABLE)
    except GameProviderNotConfigured:
        raise HTTPException(status_code=503, detail=_ERR_PROVIDER_NOT_CONFIGURED)
    return _listed_game_to_response(game)


@router.delete("/{list_id}/games/{game_id}", status_code=204)
def remove_game_from_list(
    list_id: int,
    game_id: str,
    current_user: User = Depends(get_current_user),
    use_case: RemoveGameFromListUseCase = Depends(get_remove_game_from_list_use_case),
):
    try:
        use_case.execute(
            user_id=current_user.id,
            list_id=list_id,
            external_id=game_id,
        )
    except (GameListNotFound, GameNotInList):
        raise HTTPException(status_code=404, detail=_ERR_LIST_NOT_FOUND)
