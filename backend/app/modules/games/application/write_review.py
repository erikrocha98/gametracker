from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.entities import UserGame, UserGameStatus
from app.modules.games.domain.exceptions import ReviewTooLong
from app.modules.games.domain.repositories import UserGameRepository

MAX_REVIEW_LENGTH = 5000


class WriteReviewUseCase:
    def __init__(
        self,
        details_use_case: GetGameDetailsUseCase,
        repository: UserGameRepository,
    ) -> None:
        self._details_use_case = details_use_case
        self._repository = repository

    def execute(self, *, user_id: int, external_id: str, review: str) -> UserGame:
        review = review.strip()
        if not review or len(review) > MAX_REVIEW_LENGTH:
            raise ReviewTooLong

        self._details_use_case.execute(external_id)
        internal_id = self._repository.find_internal_game_id(external_id)

        if not self._repository.exists(user_id=user_id, game_id=internal_id):
            self._repository.add(user_id=user_id, game_id=internal_id, status=UserGameStatus.want_to_play)

        return self._repository.set_review(user_id=user_id, game_id=internal_id, review=review)
