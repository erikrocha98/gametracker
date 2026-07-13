from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.game_lists.application.create_game_list import CreateGameListUseCase
from app.modules.game_lists.application.delete_game_list import DeleteGameListUseCase
from app.modules.game_lists.application.get_user_lists import GetUserListsUseCase
from app.modules.game_lists.application.update_game_list import UpdateGameListUseCase
from app.modules.game_lists.domain.repositories import GameListRepository
from app.modules.game_lists.infrastructure.sqlalchemy_game_list_repository import SqlAlchemyGameListRepository


def get_game_list_repository(
    session: Session = Depends(get_db),
) -> GameListRepository:
    return SqlAlchemyGameListRepository(session)


def get_create_game_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> CreateGameListUseCase:
    return CreateGameListUseCase(repository=repo)


def get_user_lists_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> GetUserListsUseCase:
    return GetUserListsUseCase(repository=repo)


def get_update_game_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> UpdateGameListUseCase:
    return UpdateGameListUseCase(repository=repo)


def get_delete_game_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> DeleteGameListUseCase:
    return DeleteGameListUseCase(repository=repo)
