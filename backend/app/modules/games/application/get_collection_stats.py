from dataclasses import dataclass

from app.modules.games.domain.entities import UserGame, UserGameStatus
from app.modules.games.domain.repositories import UserGameRepository

RECENT_GAMES_LIMIT = 6


@dataclass
class CollectionStats:
    games_rated: int
    average_rating: float | None
    status_counts: dict[UserGameStatus, int]
    recent_games: list[UserGame]


class GetCollectionStatsUseCase:
    def __init__(self, repository: UserGameRepository) -> None:
        self._repository = repository

    def execute(self, user_id: int) -> CollectionStats:
        # list_by_user is already ordered by added_at DESC.
        games = self._repository.list_by_user(user_id)

        ratings = [g.rating for g in games if g.rating is not None]
        average_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

        status_counts = {status: 0 for status in UserGameStatus}
        for game in games:
            status_counts[game.status] += 1

        return CollectionStats(
            games_rated=len(ratings),
            average_rating=average_rating,
            status_counts=status_counts,
            recent_games=games[:RECENT_GAMES_LIMIT],
        )
