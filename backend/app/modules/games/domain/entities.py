from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class GameSearchResult:
    id: str
    name: str
    cover_url: str | None
    platforms: list[str]
    release_year: int | None


@dataclass
class GameDetail:
    id: str
    name: str
    description: str | None
    release_date: date | None
    cover_url: str | None
    genres: list[str]
    platforms: list[str]
    developers: list[str]
    rawg_rating: float | None
    screenshots: list[str]


@dataclass
class UserGame:
    id: int
    user_id: int
    game_id: int
    external_id: str
    name: str
    cover_url: str | None
    platforms: list[str]
    release_year: int | None
    added_at: datetime
