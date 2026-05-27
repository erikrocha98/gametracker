from datetime import datetime, timezone

from sqlalchemy import BigInteger, Date, DateTime, Float, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.database import Base
from app.modules.games.domain.entities import GameDetail


class GameModel(Base):
    __tablename__ = "games"
    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_games_external"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), nullable=False)
    external_source: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    release_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    genres: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    platforms: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    developers: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    screenshots: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    rawg_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


def _parse_external_id(api_id: str) -> tuple[str, str]:
    parts = api_id.split("-", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError(f"Invalid game id format: {api_id!r}")
    return parts[0], parts[1]


class SqlAlchemyGameRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def find_by_id(self, game_id: str) -> GameDetail | None:
        external_source, external_id = _parse_external_id(game_id)
        row = (
            self._session.query(GameModel)
            .filter_by(external_source=external_source, external_id=external_id)
            .first()
        )
        if row is None:
            return None
        return self._to_entity(row)

    def save(self, detail: GameDetail) -> None:
        external_source, external_id = _parse_external_id(detail.id)
        existing = (
            self._session.query(GameModel)
            .filter_by(external_source=external_source, external_id=external_id)
            .first()
        )
        if existing:
            existing.name = detail.name
            existing.description = detail.description
            existing.release_date = detail.release_date
            existing.cover_url = detail.cover_url
            existing.genres = detail.genres
            existing.platforms = detail.platforms
            existing.developers = detail.developers
            existing.screenshots = detail.screenshots
            existing.rawg_rating = detail.rawg_rating
            existing.cached_at = datetime.now(timezone.utc)
        else:
            self._session.add(
                GameModel(
                    external_source=external_source,
                    external_id=external_id,
                    name=detail.name,
                    description=detail.description,
                    release_date=detail.release_date,
                    cover_url=detail.cover_url,
                    genres=detail.genres,
                    platforms=detail.platforms,
                    developers=detail.developers,
                    screenshots=detail.screenshots,
                    rawg_rating=detail.rawg_rating,
                )
            )
        self._session.flush()

    @staticmethod
    def _to_entity(row: GameModel) -> GameDetail:
        return GameDetail(
            id=f"{row.external_source}-{row.external_id}",
            name=row.name,
            description=row.description,
            release_date=row.release_date,
            cover_url=row.cover_url,
            genres=row.genres or [],
            platforms=row.platforms or [],
            developers=row.developers or [],
            rawg_rating=row.rawg_rating,
            screenshots=row.screenshots or [],
        )
