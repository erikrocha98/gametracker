from dataclasses import dataclass, field
from datetime import datetime

MAX_GAMES_PER_LIST = 50


@dataclass
class GameList:
    id: int
    user_id: int
    name: str
    description: str | None
    is_public: bool
    created_at: datetime
    updated_at: datetime


@dataclass
class ListedGame:
    game_id: str  # external id, e.g. "rawg-3328"
    name: str
    cover_url: str | None
    platforms: list[str]
    release_year: int | None
    added_at: datetime


@dataclass
class GameListPreview:
    game_list: GameList
    game_count: int
    cover_urls: list[str] = field(default_factory=list)
    contains_game: bool | None = None
