from dataclasses import dataclass, field


@dataclass
class GameSearchResult:
    id: str
    name: str
    cover_url: str | None
    platforms: list[str]
    release_year: int | None
