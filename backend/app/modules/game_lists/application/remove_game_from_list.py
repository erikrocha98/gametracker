from app.modules.game_lists.domain.exceptions import GameListNotFound, GameNotInList
from app.modules.game_lists.domain.repositories import GameCatalog, GameListItemRepository, GameListRepository


class RemoveGameFromListUseCase:
    def __init__(
        self,
        list_repository: GameListRepository,
        item_repository: GameListItemRepository,
        game_catalog: GameCatalog,
    ) -> None:
        self._list_repository = list_repository
        self._item_repository = item_repository
        self._game_catalog = game_catalog

    def execute(self, *, user_id: int, list_id: int, external_id: str) -> None:
        if self._list_repository.get(user_id=user_id, list_id=list_id) is None:
            raise GameListNotFound

        internal_id = self._game_catalog.resolve_game_id(external_id)
        if internal_id is None:
            raise GameNotInList

        if not self._item_repository.remove(list_id=list_id, game_id=internal_id):
            raise GameNotInList
