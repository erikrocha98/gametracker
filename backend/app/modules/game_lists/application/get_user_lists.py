from app.modules.game_lists.domain.entities import GameList
from app.modules.game_lists.domain.repositories import GameListRepository


class GetUserListsUseCase:
    def __init__(self, repository: GameListRepository) -> None:
        self._repository = repository

    def execute(self, user_id: int) -> list[GameList]:
        return self._repository.list_by_user(user_id)
