from app.modules.game_lists.domain.entities import ListedGame, MAX_GAMES_PER_LIST
from app.modules.game_lists.domain.exceptions import GameAlreadyInList, GameListFull, GameListNotFound
from app.modules.game_lists.domain.repositories import GameCatalog, GameListItemRepository, GameListRepository


class AddGameToListUseCase:
    def __init__(
        self,
        list_repository: GameListRepository,
        item_repository: GameListItemRepository,
        game_catalog: GameCatalog,
    ) -> None:
        self._list_repository = list_repository
        self._item_repository = item_repository
        self._game_catalog = game_catalog

    def execute(self, *, user_id: int, list_id: int, external_id: str) -> ListedGame:
        if self._list_repository.get(user_id=user_id, list_id=list_id) is None:
            raise GameListNotFound

        internal_id = self._game_catalog.ensure_game(external_id)

        if self._item_repository.exists(list_id=list_id, game_id=internal_id):
            raise GameAlreadyInList

        if self._item_repository.count(list_id) >= MAX_GAMES_PER_LIST:
            raise GameListFull

        return self._item_repository.add(list_id=list_id, game_id=internal_id)
