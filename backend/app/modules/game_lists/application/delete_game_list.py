from app.modules.game_lists.domain.exceptions import GameListNotFound
from app.modules.game_lists.domain.repositories import GameListRepository


class DeleteGameListUseCase:
    def __init__(self, repository: GameListRepository) -> None:
        self._repository = repository

    def execute(self, *, user_id: int, list_id: int) -> None:
        if not self._repository.delete(user_id=user_id, list_id=list_id):
            raise GameListNotFound
