from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.game_lists.application.add_game_to_list import AddGameToListUseCase
from app.modules.game_lists.application.create_game_list import CreateGameListUseCase
from app.modules.game_lists.application.delete_game_list import DeleteGameListUseCase
from app.modules.game_lists.application.get_list_games import GetListGamesUseCase
from app.modules.game_lists.application.get_user_lists import GetUserListsUseCase
from app.modules.game_lists.application.remove_game_from_list import RemoveGameFromListUseCase
from app.modules.game_lists.application.update_game_list import UpdateGameListUseCase
from app.modules.game_lists.domain.repositories import GameCatalog, GameListItemRepository, GameListRepository
from app.modules.game_lists.infrastructure.games_catalog_adapter import GamesCatalogAdapter
from app.modules.game_lists.infrastructure.sqlalchemy_game_list_item_repository import SqlAlchemyGameListItemRepository
from app.modules.game_lists.infrastructure.sqlalchemy_game_list_repository import SqlAlchemyGameListRepository

# Cross-module import permitted here: sole wiring point between game_lists and games.
from app.modules.games.api.dependencies import get_game_details_use_case, get_user_game_repository
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.repositories import UserGameRepository


def get_game_list_repository(
    session: Session = Depends(get_db),
) -> GameListRepository:
    return SqlAlchemyGameListRepository(session)


def get_game_list_item_repository(
    session: Session = Depends(get_db),
) -> GameListItemRepository:
    return SqlAlchemyGameListItemRepository(session)


def get_game_catalog(
    details_uc: GetGameDetailsUseCase = Depends(get_game_details_use_case),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
) -> GameCatalog:
    return GamesCatalogAdapter(
        details_use_case=details_uc,
        user_game_repository=user_game_repo,
    )


def get_create_game_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> CreateGameListUseCase:
    return CreateGameListUseCase(repository=repo)


def get_user_lists_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
    item_repo: GameListItemRepository = Depends(get_game_list_item_repository),
    catalog: GameCatalog = Depends(get_game_catalog),
) -> GetUserListsUseCase:
    return GetUserListsUseCase(
        repository=repo,
        item_repository=item_repo,
        game_catalog=catalog,
    )


def get_update_game_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> UpdateGameListUseCase:
    return UpdateGameListUseCase(repository=repo)


def get_delete_game_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
) -> DeleteGameListUseCase:
    return DeleteGameListUseCase(repository=repo)


def get_add_game_to_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
    item_repo: GameListItemRepository = Depends(get_game_list_item_repository),
    catalog: GameCatalog = Depends(get_game_catalog),
) -> AddGameToListUseCase:
    return AddGameToListUseCase(
        list_repository=repo,
        item_repository=item_repo,
        game_catalog=catalog,
    )


def get_remove_game_from_list_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
    item_repo: GameListItemRepository = Depends(get_game_list_item_repository),
    catalog: GameCatalog = Depends(get_game_catalog),
) -> RemoveGameFromListUseCase:
    return RemoveGameFromListUseCase(
        list_repository=repo,
        item_repository=item_repo,
        game_catalog=catalog,
    )


def get_list_games_use_case(
    repo: GameListRepository = Depends(get_game_list_repository),
    item_repo: GameListItemRepository = Depends(get_game_list_item_repository),
) -> GetListGamesUseCase:
    return GetListGamesUseCase(
        list_repository=repo,
        item_repository=item_repo,
    )
