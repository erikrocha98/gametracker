import pytest

from tests.conftest import FakeGameDetailProvider, FakeGameRepository, FakeUserGameRepository
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.write_review import WriteReviewUseCase
from app.modules.games.domain.entities import GameDetail, UserGameStatus
from app.modules.games.domain.exceptions import ReviewTooLong


def _make_detail(game_id: str = "rawg-1") -> GameDetail:
    return GameDetail(
        id=game_id,
        name="Test Game",
        description=None,
        release_date=None,
        cover_url=None,
        genres=[],
        platforms=[],
        developers=[],
        rawg_rating=None,
        screenshots=[],
    )


def _make_use_case(
    repo: FakeUserGameRepository,
    detail: GameDetail,
) -> WriteReviewUseCase:
    provider = FakeGameDetailProvider(detail=detail)
    game_repo = FakeGameRepository()
    details_uc = GetGameDetailsUseCase(provider=provider, repository=game_repo)
    return WriteReviewUseCase(details_use_case=details_uc, repository=repo)


def test_write_review_success():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.add(user_id=1, game_id=10)

    uc = _make_use_case(repo, _make_detail())
    result = uc.execute(user_id=1, external_id="rawg-1", review="Great game")

    assert result.review == "Great game"
    assert result.review_created_at is not None
    assert result.review_updated_at is not None


def test_write_review_strips_whitespace():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.add(user_id=1, game_id=10)

    uc = _make_use_case(repo, _make_detail())
    result = uc.execute(user_id=1, external_id="rawg-1", review="  spaced  ")

    assert result.review == "spaced"


def test_write_review_edit_keeps_created_at():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.add(user_id=1, game_id=10)

    uc = _make_use_case(repo, _make_detail())
    first = uc.execute(user_id=1, external_id="rawg-1", review="First")
    created_at = first.review_created_at

    second = uc.execute(user_id=1, external_id="rawg-1", review="Edited")

    assert second.review == "Edited"
    assert second.review_created_at == created_at
    assert second.review_updated_at >= created_at


def test_write_review_auto_adds_to_collection():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = _make_use_case(repo, _make_detail())
    result = uc.execute(user_id=1, external_id="rawg-1", review="Nice")

    assert repo.exists(user_id=1, game_id=10)
    assert result.status == UserGameStatus.want_to_play


@pytest.mark.parametrize("review", ["", "   "])
def test_write_review_empty_raises(review: str):
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = _make_use_case(repo, _make_detail())
    with pytest.raises(ReviewTooLong):
        uc.execute(user_id=1, external_id="rawg-1", review=review)


def test_write_review_too_long_raises():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = _make_use_case(repo, _make_detail())
    with pytest.raises(ReviewTooLong):
        uc.execute(user_id=1, external_id="rawg-1", review="a" * 5001)
