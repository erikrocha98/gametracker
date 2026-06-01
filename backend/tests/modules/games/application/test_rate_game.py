import pytest

from tests.conftest import FakeGameDetailProvider, FakeGameRepository, FakeUserGameRepository
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.rate_game import RateGameUseCase
from app.modules.games.domain.entities import GameDetail, UserGameStatus
from app.modules.games.domain.exceptions import InvalidRating


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
) -> RateGameUseCase:
    provider = FakeGameDetailProvider(detail=detail)
    game_repo = FakeGameRepository()
    details_uc = GetGameDetailsUseCase(provider=provider, repository=game_repo)
    return RateGameUseCase(details_use_case=details_uc, repository=repo)


def test_rate_game_success():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.add(user_id=1, game_id=10)

    uc = _make_use_case(repo, _make_detail())
    result = uc.execute(user_id=1, external_id="rawg-1", rating=4.5)

    assert result.rating == 4.5
    assert result.status == UserGameStatus.finished


def test_rate_game_auto_adds_to_collection():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = _make_use_case(repo, _make_detail())
    result = uc.execute(user_id=1, external_id="rawg-1", rating=3.0)

    assert result.rating == 3.0
    assert repo.exists(user_id=1, game_id=10)


def test_rate_game_marks_finished():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.add(user_id=1, game_id=10, status=UserGameStatus.want_to_play)

    uc = _make_use_case(repo, _make_detail())
    result = uc.execute(user_id=1, external_id="rawg-1", rating=2.5)

    assert result.status == UserGameStatus.finished


@pytest.mark.parametrize("rating", [0.0, 5.5, 0.3, 1.7, -1.0])
def test_rate_game_invalid_rating_raises(rating: float):
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = _make_use_case(repo, _make_detail())
    with pytest.raises(InvalidRating):
        uc.execute(user_id=1, external_id="rawg-1", rating=rating)
