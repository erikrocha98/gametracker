from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.entities import UserGame, UserGameStatus
from app.modules.games.domain.exceptions import InvalidRating
from app.modules.games.domain.repositories import UserGameRepository


class RateGameUseCase:
    def __init__(
        self,
        details_use_case: GetGameDetailsUseCase,
        repository: UserGameRepository,
    ) -> None:
        self._details_use_case = details_use_case
        self._repository = repository

    def execute(self, *, user_id: int, external_id: str, rating: float) -> UserGame:
        if rating < 0.5 or rating > 5.0 or round(rating * 2) != rating * 2:
            raise InvalidRating

        self._details_use_case.execute(external_id)
        internal_id = self._repository.find_internal_game_id(external_id)

        if not self._repository.exists(user_id=user_id, game_id=internal_id):
            self._repository.add(user_id=user_id, game_id=internal_id, status=UserGameStatus.finished)

        return self._repository.set_rating(user_id=user_id, game_id=internal_id, rating=rating)
