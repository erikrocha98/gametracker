from sqlalchemy.orm import Session

from app.modules.games.domain.entities import UserGame, UserGameStatus
from app.modules.games.infrastructure.external_id import parse_external_id
from app.modules.games.infrastructure.sqlalchemy_repository import GameModel
from app.modules.games.infrastructure.user_game_model import UserGameModel, UserGameStatus as OrmUserGameStatus


class SqlAlchemyUserGameRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def find_internal_game_id(self, external_id: str) -> int | None:
        try:
            source, eid = parse_external_id(external_id)
        except ValueError:
            return None
        row = (
            self._session.query(GameModel.id)
            .filter_by(external_source=source, external_id=eid)
            .scalar()
        )
        return row

    def exists(self, *, user_id: int, game_id: int) -> bool:
        return (
            self._session.query(UserGameModel)
            .filter_by(user_id=user_id, game_id=game_id)
            .first()
        ) is not None

    def get(self, *, user_id: int, game_id: int) -> UserGame | None:
        row = (
            self._session.query(UserGameModel)
            .filter_by(user_id=user_id, game_id=game_id)
            .first()
        )
        return self._hydrate(row) if row else None

    def add(self, *, user_id: int, game_id: int, status: UserGameStatus = UserGameStatus.want_to_play) -> UserGame:
        row = UserGameModel(user_id=user_id, game_id=game_id, status=OrmUserGameStatus(status.value))
        self._session.add(row)
        self._session.flush()
        return self._hydrate(row)

    def remove(self, *, user_id: int, game_id: int) -> bool:
        deleted = (
            self._session.query(UserGameModel)
            .filter_by(user_id=user_id, game_id=game_id)
            .delete()
        )
        return bool(deleted)

    def set_rating(self, *, user_id: int, game_id: int, rating: float) -> UserGame:
        row = (
            self._session.query(UserGameModel)
            .filter_by(user_id=user_id, game_id=game_id)
            .first()
        )
        row.rating = rating
        row.status = OrmUserGameStatus.finished
        self._session.flush()
        return self._hydrate(row)

    def clear_rating(self, *, user_id: int, game_id: int) -> bool:
        row = (
            self._session.query(UserGameModel)
            .filter_by(user_id=user_id, game_id=game_id)
            .first()
        )
        if row is None:
            return False
        row.rating = None
        self._session.flush()
        return True

    def list_by_user(self, user_id: int, status: UserGameStatus | None = None) -> list[UserGame]:
        query = self._session.query(UserGameModel).filter_by(user_id=user_id)
        if status is not None:
            query = query.filter(UserGameModel.status == OrmUserGameStatus(status.value))
        rows = query.order_by(UserGameModel.added_at.desc()).all()
        return [self._hydrate(r) for r in rows]

    def _hydrate(self, row: UserGameModel) -> UserGame:
        game = self._session.get(GameModel, row.game_id)
        release_year = game.release_date.year if game and game.release_date else None
        external_id = f"{game.external_source}-{game.external_id}" if game else ""
        return UserGame(
            id=row.id,
            user_id=row.user_id,
            game_id=row.game_id,
            external_id=external_id,
            name=game.name if game else "",
            cover_url=game.cover_url if game else None,
            platforms=list(game.platforms) if game else [],
            release_year=release_year,
            added_at=row.added_at,
            status=UserGameStatus(row.status.value),
            rating=float(row.rating) if row.rating is not None else None,
        )
