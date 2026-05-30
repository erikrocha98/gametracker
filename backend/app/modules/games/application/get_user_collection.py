from app.modules.games.domain.entities import UserGame, UserGameStatus
from app.modules.games.domain.repositories import UserGameRepository


class GetUserCollectionUseCase:
    def __init__(self, repository: UserGameRepository) -> None:
        self._repository = repository

    def execute(self, user_id: int, status: UserGameStatus | None = None) -> list[UserGame]:
        return self._repository.list_by_user(user_id, status)
