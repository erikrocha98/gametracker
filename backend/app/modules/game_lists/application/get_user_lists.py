from app.modules.game_lists.domain.entities import GameListPreview
from app.modules.game_lists.domain.repositories import GameCatalog, GameListItemRepository, GameListRepository


class GetUserListsUseCase:
    def __init__(
        self,
        repository: GameListRepository,
        item_repository: GameListItemRepository,
        game_catalog: GameCatalog,
    ) -> None:
        self._repository = repository
        self._item_repository = item_repository
        self._game_catalog = game_catalog

    def execute(
        self,
        user_id: int,
        *,
        contains_external_id: str | None = None,
    ) -> list[GameListPreview]:
        lists = self._repository.list_by_user(user_id)
        if not lists:
            return []

        list_ids = [gl.id for gl in lists]
        counts = self._item_repository.counts_by_list(list_ids)
        covers = self._item_repository.recent_covers(list_ids, limit=5)

        containing: set[int] = set()
        if contains_external_id is not None:
            internal_id = self._game_catalog.resolve_game_id(contains_external_id)
            if internal_id is not None:
                containing = self._item_repository.list_ids_containing(
                    list_ids=list_ids, game_id=internal_id
                )

        return [
            GameListPreview(
                game_list=gl,
                game_count=counts.get(gl.id, 0),
                cover_urls=covers.get(gl.id, []),
                contains_game=(gl.id in containing) if contains_external_id is not None else None,
            )
            for gl in lists
        ]
