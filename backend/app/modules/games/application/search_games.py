from app.modules.games.domain.entities import GameSearchResult
from app.modules.games.domain.repositories import GameSearchProvider


class SearchGamesUseCase:
    def __init__(self, provider: GameSearchProvider) -> None:
        self._provider = provider

    def execute(self, query: str) -> list[GameSearchResult]:
        query = query.strip()
        if len(query) < 2:
            return []
        return self._provider.search(query)
