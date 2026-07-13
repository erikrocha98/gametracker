from datetime import datetime

from pydantic import BaseModel, Field


class CreateGameListRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = None


class UpdateGameListRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = None


class GameListResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_public: bool = Field(..., alias="isPublic")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}


class GameListsResponse(BaseModel):
    items: list[GameListResponse]
