from datetime import date

from pydantic import BaseModel, Field


class GameSearchResultResponse(BaseModel):
    id: str
    name: str
    cover_url: str | None = Field(None, alias="coverUrl")
    platforms: list[str]
    release_year: int | None = Field(None, alias="releaseYear")

    model_config = {"populate_by_name": True, "from_attributes": True}


class GameSearchResponse(BaseModel):
    results: list[GameSearchResultResponse]


class GameDetailResponse(BaseModel):
    id: str
    name: str
    description: str | None
    release_date: date | None = Field(None, alias="releaseDate")
    cover_url: str | None = Field(None, alias="coverUrl")
    genres: list[str]
    platforms: list[str]
    developers: list[str]
    platform_average_rating: float | None = Field(None, alias="platformAverageRating")
    rawg_rating: float | None = Field(None, alias="rawgRating")
    screenshots: list[str]

    model_config = {"populate_by_name": True, "from_attributes": True}
