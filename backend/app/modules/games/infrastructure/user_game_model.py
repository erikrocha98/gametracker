import enum
from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, Enum as SAEnum, ForeignKey, Index, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserGameStatus(enum.Enum):
    want_to_play = "want_to_play"
    playing = "playing"
    finished = "finished"


class UserGameModel(Base):
    __tablename__ = "user_games"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="uq_user_games_user_game"),
        Index("ix_user_games_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    game_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("games.id", ondelete="CASCADE"), nullable=False
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    status: Mapped[UserGameStatus] = mapped_column(
        SAEnum(UserGameStatus, name="user_game_status"),
        nullable=False,
        default=UserGameStatus.want_to_play,
    )
    rating: Mapped[float | None] = mapped_column(Numeric(2, 1), nullable=True)
    review: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
