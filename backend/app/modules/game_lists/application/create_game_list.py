from app.modules.game_lists.domain.entities import GameList
from app.modules.game_lists.domain.repositories import GameListRepository


class CreateGameListUseCase:
    def __init__(self, repository: GameListRepository) -> None:
        self._repository = repository

    def execute(self, *, user_id: int, name: str, description: str | None = None, is_public: bool = False) -> GameList:
        return self._repository.create(
            user_id=user_id, name=name, description=description, is_public=is_public
        )
