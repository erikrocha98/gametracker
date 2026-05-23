from fastapi import Depends

from app.core.config import Settings, get_settings
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.repositories import GameSearchProvider
from app.modules.games.infrastructure.rawg_provider import RawgGameSearchProvider


def get_game_search_provider(
    settings: Settings = Depends(get_settings),
) -> GameSearchProvider:
    return RawgGameSearchProvider(api_key=settings.rawg_api_key)


def get_search_games_use_case(
    provider: GameSearchProvider = Depends(get_game_search_provider),
) -> SearchGamesUseCase:
    return SearchGamesUseCase(provider=provider)
