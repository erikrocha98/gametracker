from typing import Protocol

from app.modules.games.domain.entities import GameDetail, GameSearchResult


class GameSearchProvider(Protocol):
    def search(self, query: str) -> list[GameSearchResult]: ...


class GameDetailProvider(Protocol):
    def get_by_id(self, game_id: str) -> GameDetail: ...


class GameRepository(Protocol):
    def find_by_id(self, game_id: str) -> GameDetail | None: ...
    def save(self, detail: GameDetail) -> None: ...
