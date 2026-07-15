from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.game_lists.domain.entities import ListedGame
from app.modules.game_lists.infrastructure.game_list_item_model import GameListItemModel

# Cross-module import permitted here: infrastructure join between two ORM models
# is the only point where game_lists reads directly from games infrastructure.
from app.modules.games.infrastructure.sqlalchemy_repository import GameModel


class SqlAlchemyGameListItemRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, *, list_id: int, game_id: int) -> ListedGame:
        row = GameListItemModel(list_id=list_id, game_id=game_id)
        self._session.add(row)
        self._session.flush()
        return self._hydrate(row)

    def remove(self, *, list_id: int, game_id: int) -> bool:
        deleted = (
            self._session.query(GameListItemModel)
            .filter_by(list_id=list_id, game_id=game_id)
            .delete()
        )
        return bool(deleted)

    def exists(self, *, list_id: int, game_id: int) -> bool:
        return (
            self._session.query(GameListItemModel)
            .filter_by(list_id=list_id, game_id=game_id)
            .first()
        ) is not None

    def count(self, list_id: int) -> int:
        return (
            self._session.query(func.count(GameListItemModel.id))
            .filter_by(list_id=list_id)
            .scalar()
        ) or 0

    def list_games(self, list_id: int) -> list[ListedGame]:
        rows = (
            self._session.query(GameListItemModel)
            .filter_by(list_id=list_id)
            .order_by(GameListItemModel.added_at.desc())
            .all()
        )
        return [self._hydrate(r) for r in rows]

    def counts_by_list(self, list_ids: list[int]) -> dict[int, int]:
        if not list_ids:
            return {}
        rows = (
            self._session.query(GameListItemModel.list_id, func.count(GameListItemModel.id))
            .filter(GameListItemModel.list_id.in_(list_ids))
            .group_by(GameListItemModel.list_id)
            .all()
        )
        result = {lid: 0 for lid in list_ids}
        for list_id, count in rows:
            result[list_id] = count
        return result

    def recent_covers(self, list_ids: list[int], *, limit: int = 5) -> dict[int, list[str]]:
        if not list_ids:
            return {}
        rows = (
            self._session.query(GameListItemModel.list_id, GameModel.cover_url)
            .join(GameModel, GameListItemModel.game_id == GameModel.id)
            .filter(
                GameListItemModel.list_id.in_(list_ids),
                GameModel.cover_url.isnot(None),
            )
            .order_by(GameListItemModel.list_id, GameListItemModel.added_at.desc())
            .all()
        )
        result: dict[int, list[str]] = {lid: [] for lid in list_ids}
        for list_id, cover_url in rows:
            if len(result[list_id]) < limit:
                result[list_id].append(cover_url)
        return result

    def list_ids_containing(self, *, list_ids: list[int], game_id: int) -> set[int]:
        if not list_ids:
            return set()
        rows = (
            self._session.query(GameListItemModel.list_id)
            .filter(
                GameListItemModel.list_id.in_(list_ids),
                GameListItemModel.game_id == game_id,
            )
            .all()
        )
        return {row[0] for row in rows}

    def _hydrate(self, row: GameListItemModel) -> ListedGame:
        game = self._session.get(GameModel, row.game_id)
        release_year = game.release_date.year if game and game.release_date else None
        external_id = f"{game.external_source}-{game.external_id}" if game else ""
        return ListedGame(
            game_id=external_id,
            name=game.name if game else "",
            cover_url=game.cover_url if game else None,
            platforms=list(game.platforms) if game else [],
            release_year=release_year,
            added_at=row.added_at,
        )
