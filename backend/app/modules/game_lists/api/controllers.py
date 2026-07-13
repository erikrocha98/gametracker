from fastapi import APIRouter, Depends, HTTPException

from app.modules.game_lists.api.dependencies import (
    get_create_game_list_use_case,
    get_delete_game_list_use_case,
    get_update_game_list_use_case,
    get_user_lists_use_case,
)
from app.modules.game_lists.api.schemas import (
    CreateGameListRequest,
    GameListResponse,
    GameListsResponse,
    UpdateGameListRequest,
)
from app.modules.game_lists.application.create_game_list import CreateGameListUseCase
from app.modules.game_lists.application.delete_game_list import DeleteGameListUseCase
from app.modules.game_lists.application.get_user_lists import GetUserListsUseCase
from app.modules.game_lists.application.update_game_list import UpdateGameListUseCase
from app.modules.game_lists.domain.entities import GameList
from app.modules.game_lists.domain.exceptions import GameListNotFound
from app.modules.users.api.dependencies import get_current_user
from app.modules.users.domain.entities import User

router = APIRouter(prefix="/lists", tags=["lists"])

_ERR_LIST_NOT_FOUND = "List not found"


def _to_response(game_list: GameList) -> GameListResponse:
    return GameListResponse(
        id=game_list.id,
        name=game_list.name,
        description=game_list.description,
        is_public=game_list.is_public,
        created_at=game_list.created_at,
        updated_at=game_list.updated_at,
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
    return _to_response(item)


@router.get("", response_model=GameListsResponse, response_model_by_alias=True)
def get_lists(
    current_user: User = Depends(get_current_user),
    use_case: GetUserListsUseCase = Depends(get_user_lists_use_case),
):
    items = use_case.execute(current_user.id)
    return GameListsResponse(items=[_to_response(i) for i in items])


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
    return _to_response(item)


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
