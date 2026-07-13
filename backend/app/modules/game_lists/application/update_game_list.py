from app.modules.game_lists.domain.entities import GameList
from app.modules.game_lists.domain.exceptions import GameListNotFound
from app.modules.game_lists.domain.repositories import GameListRepository


class UpdateGameListUseCase:
    def __init__(self, repository: GameListRepository) -> None:
        self._repository = repository

    def execute(self, *, user_id: int, list_id: int, name: str, description: str | None = None) -> GameList:
        if self._repository.get(user_id=user_id, list_id=list_id) is None:
            raise GameListNotFound
        return self._repository.update(
            user_id=user_id, list_id=list_id, name=name, description=description
        )
