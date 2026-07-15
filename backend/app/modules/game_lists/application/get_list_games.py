from app.modules.game_lists.domain.entities import GameList, ListedGame
from app.modules.game_lists.domain.exceptions import GameListNotFound
from app.modules.game_lists.domain.repositories import GameListItemRepository, GameListRepository


class GetListGamesUseCase:
    def __init__(
        self,
        list_repository: GameListRepository,
        item_repository: GameListItemRepository,
    ) -> None:
        self._list_repository = list_repository
        self._item_repository = item_repository

    def execute(self, *, user_id: int, list_id: int) -> tuple[GameList, list[ListedGame]]:
        game_list = self._list_repository.get(user_id=user_id, list_id=list_id)
        if game_list is None:
            raise GameListNotFound
        return game_list, self._item_repository.list_games(list_id)
