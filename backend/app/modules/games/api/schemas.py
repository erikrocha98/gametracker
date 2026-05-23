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
