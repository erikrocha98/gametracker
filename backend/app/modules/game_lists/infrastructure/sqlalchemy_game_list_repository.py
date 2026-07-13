from sqlalchemy.orm import Session

from app.modules.game_lists.domain.entities import GameList
from app.modules.game_lists.infrastructure.game_list_model import GameListModel


class SqlAlchemyGameListRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, *, user_id: int, name: str, description: str | None, is_public: bool = False) -> GameList:
        row = GameListModel(user_id=user_id, name=name, description=description, is_public=is_public)
        self._session.add(row)
        self._session.flush()
        return self._hydrate(row)

    def list_by_user(self, user_id: int) -> list[GameList]:
        rows = (
            self._session.query(GameListModel)
            .filter_by(user_id=user_id)
            .order_by(GameListModel.created_at.desc())
            .all()
        )
        return [self._hydrate(r) for r in rows]

    def get(self, *, user_id: int, list_id: int) -> GameList | None:
        row = (
            self._session.query(GameListModel)
            .filter_by(user_id=user_id, id=list_id)
            .first()
        )
        return self._hydrate(row) if row else None

    def update(self, *, user_id: int, list_id: int, name: str, description: str | None) -> GameList:
        row = (
            self._session.query(GameListModel)
            .filter_by(user_id=user_id, id=list_id)
            .first()
        )
        row.name = name
        row.description = description
        self._session.flush()
        return self._hydrate(row)

    def delete(self, *, user_id: int, list_id: int) -> bool:
        deleted = (
            self._session.query(GameListModel)
            .filter_by(user_id=user_id, id=list_id)
            .delete()
        )
        return bool(deleted)

    def _hydrate(self, row: GameListModel) -> GameList:
        return GameList(
            id=row.id,
            user_id=row.user_id,
            name=row.name,
            description=row.description,
            is_public=row.is_public,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
