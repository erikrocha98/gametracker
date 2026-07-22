from datetime import date, datetime

from pydantic import BaseModel, Field

from app.modules.games.domain.entities import UserGameStatus


class GameSearchResultResponse(BaseModel):
    id: str
    name: str
    cover_url: str | None = Field(None, alias="coverUrl")
    platforms: list[str]
    release_year: int | None = Field(None, alias="releaseYear")

    model_config = {"populate_by_name": True, "from_attributes": True}


class GameSearchResponse(BaseModel):
    results: list[GameSearchResultResponse]


class CollectionGameResponse(BaseModel):
    id: int
    game_id: str = Field(..., alias="gameId")
    name: str
    cover_url: str | None = Field(None, alias="coverUrl")
    platforms: list[str]
    release_year: int | None = Field(None, alias="releaseYear")
    rating: float | None = Field(None)
    status: UserGameStatus

    model_config = {"populate_by_name": True, "from_attributes": True}


class CollectionResponse(BaseModel):
    items: list[CollectionGameResponse]


class StatusCountsResponse(BaseModel):
    want_to_play: int = Field(..., alias="wantToPlay")
    playing: int
    finished: int

    model_config = {"populate_by_name": True}


class CollectionStatsResponse(BaseModel):
    games_rated: int = Field(..., alias="gamesRated")
    reviews_count: int = Field(..., alias="reviewsCount")
    average_rating: float | None = Field(None, alias="averageRating")
    status_counts: StatusCountsResponse = Field(..., alias="statusCounts")
    recent_games: list[CollectionGameResponse] = Field(..., alias="recentGames")

    model_config = {"populate_by_name": True}


class AddToCollectionRequest(BaseModel):
    game_id: str = Field(..., alias="gameId", min_length=1)
    model_config = {"populate_by_name": True}


class RateGameRequest(BaseModel):
    rating: float = Field(..., ge=0.5, le=5.0, multiple_of=0.5)


class WriteReviewRequest(BaseModel):
    review: str


class SetGameStatusRequest(BaseModel):
    status: UserGameStatus


class GameStatusResponse(BaseModel):
    game_id: str = Field(..., alias="gameId")
    status: UserGameStatus

    model_config = {"populate_by_name": True}


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
    user_rating: float | None = Field(None, alias="userRating")
    user_review: str | None = Field(None, alias="userReview")
    user_review_created_at: datetime | None = Field(None, alias="userReviewCreatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}


class ReviewResponse(BaseModel):
    game_id: str = Field(..., alias="gameId")
    name: str
    cover_url: str | None = Field(None, alias="coverUrl")
    platforms: list[str]
    release_year: int | None = Field(None, alias="releaseYear")
    rating: float | None = Field(None)
    review: str
    review_created_at: datetime | None = Field(None, alias="reviewCreatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}


class UserReviewsResponse(BaseModel):
    items: list[ReviewResponse]
