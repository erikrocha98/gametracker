from datetime import datetime

from pydantic import BaseModel, Field


class CreateGameListRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = None


class UpdateGameListRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = None


class AddGameToListRequest(BaseModel):
    game_id: str = Field(..., alias="gameId", min_length=1)

    model_config = {"populate_by_name": True}


class GameListResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_public: bool = Field(..., alias="isPublic")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    game_count: int = Field(0, alias="gameCount")
    cover_urls: list[str] = Field(default_factory=list, alias="coverUrls")
    contains_game: bool | None = Field(None, alias="containsGame")

    model_config = {"populate_by_name": True, "from_attributes": True}


class GameListsResponse(BaseModel):
    items: list[GameListResponse]


class ListGameResponse(BaseModel):
    game_id: str = Field(..., alias="gameId")
    name: str
    cover_url: str | None = Field(None, alias="coverUrl")
    platforms: list[str]
    release_year: int | None = Field(None, alias="releaseYear")
    added_at: datetime = Field(..., alias="addedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}


class GameListDetailResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_public: bool = Field(..., alias="isPublic")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    game_count: int = Field(..., alias="gameCount")
    items: list[ListGameResponse]

    model_config = {"populate_by_name": True, "from_attributes": True}
