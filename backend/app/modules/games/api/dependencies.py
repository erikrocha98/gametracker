from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.repositories import GameDetailProvider, GameRepository, GameSearchProvider
from app.modules.games.infrastructure.rawg_provider import RawgGameDetailProvider, RawgGameSearchProvider
from app.modules.games.infrastructure.sqlalchemy_repository import SqlAlchemyGameRepository


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
