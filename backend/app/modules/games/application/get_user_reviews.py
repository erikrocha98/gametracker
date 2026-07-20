from app.modules.games.domain.entities import UserGame
from app.modules.games.domain.repositories import UserGameRepository


class GetUserReviewsUseCase:
    def __init__(self, repository: UserGameRepository) -> None:
        self._repository = repository

    def execute(self, user_id: int) -> list[UserGame]:
        return [entry for entry in self._repository.list_by_user(user_id) if entry.review is not None]
