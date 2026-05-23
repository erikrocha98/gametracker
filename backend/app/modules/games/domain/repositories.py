from typing import Protocol

from app.modules.games.domain.entities import GameSearchResult


class GameSearchProvider(Protocol):
    def search(self, query: str) -> list[GameSearchResult]: ...
