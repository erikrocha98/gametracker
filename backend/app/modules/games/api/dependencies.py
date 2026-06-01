from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.modules.games.application.add_game_to_collection import AddGameToCollectionUseCase
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.get_user_collection import GetUserCollectionUseCase
from app.modules.games.application.get_user_game_rating import GetUserGameRatingUseCase
from app.modules.games.application.rate_game import RateGameUseCase
from app.modules.games.application.remove_game_from_collection import RemoveGameFromCollectionUseCase
from app.modules.games.application.remove_rating import RemoveRatingUseCase
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.repositories import GameDetailProvider, GameRepository, GameSearchProvider, UserGameRepository
from app.modules.games.infrastructure.rawg_provider import RawgGameDetailProvider, RawgGameSearchProvider
from app.modules.games.infrastructure.sqlalchemy_repository import SqlAlchemyGameRepository
from app.modules.games.infrastructure.sqlalchemy_user_game_repository import SqlAlchemyUserGameRepository


def get_game_search_provider(
    settings: Settings = Depends(get_settings),
) -> GameSearchProvider:
    return RawgGameSearchProvider(api_key=settings.rawg_api_key)


def get_search_games_use_case(
    provider: GameSearchProvider = Depends(get_game_search_provider),
) -> SearchGamesUseCase:
    return SearchGamesUseCase(provider=provider)


def get_game_detail_provider(
    settings: Settings = Depends(get_settings),
) -> GameDetailProvider:
    return RawgGameDetailProvider(api_key=settings.rawg_api_key)


def get_game_repository(
    session: Session = Depends(get_db),
) -> GameRepository:
    return SqlAlchemyGameRepository(session)


def get_game_details_use_case(
    provider: GameDetailProvider = Depends(get_game_detail_provider),
    repository: GameRepository = Depends(get_game_repository),
) -> GetGameDetailsUseCase:
    return GetGameDetailsUseCase(provider=provider, repository=repository)


def get_user_game_repository(
    session: Session = Depends(get_db),
) -> UserGameRepository:
    return SqlAlchemyUserGameRepository(session)


def get_add_game_to_collection_use_case(
    details_uc: GetGameDetailsUseCase = Depends(get_game_details_use_case),
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> AddGameToCollectionUseCase:
    return AddGameToCollectionUseCase(details_use_case=details_uc, repository=repo)


def get_remove_game_from_collection_use_case(
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> RemoveGameFromCollectionUseCase:
    return RemoveGameFromCollectionUseCase(repository=repo)


def get_user_collection_use_case(
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> GetUserCollectionUseCase:
    return GetUserCollectionUseCase(repository=repo)


def get_rate_game_use_case(
    details_uc: GetGameDetailsUseCase = Depends(get_game_details_use_case),
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> RateGameUseCase:
    return RateGameUseCase(details_use_case=details_uc, repository=repo)


def get_remove_rating_use_case(
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> RemoveRatingUseCase:
    return RemoveRatingUseCase(repository=repo)


def get_user_game_rating_use_case(
    repo: UserGameRepository = Depends(get_user_game_repository),
) -> GetUserGameRatingUseCase:
    return GetUserGameRatingUseCase(repository=repo)
