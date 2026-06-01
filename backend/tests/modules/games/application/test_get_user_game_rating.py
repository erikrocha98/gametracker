from tests.conftest import FakeUserGameRepository
from app.modules.games.application.get_user_game_rating import GetUserGameRatingUseCase


def test_returns_rating_when_present():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    entry = repo.add(user_id=1, game_id=10)
    entry.rating = 3.5

    uc = GetUserGameRatingUseCase(repository=repo)
    assert uc.execute(user_id=1, external_id="rawg-1") == 3.5


def test_returns_none_when_no_rating():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.add(user_id=1, game_id=10)

    uc = GetUserGameRatingUseCase(repository=repo)
    assert uc.execute(user_id=1, external_id="rawg-1") is None


def test_returns_none_when_game_not_in_collection():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = GetUserGameRatingUseCase(repository=repo)
    assert uc.execute(user_id=1, external_id="rawg-1") is None


def test_returns_none_when_external_id_unknown():
    repo = FakeUserGameRepository()

    uc = GetUserGameRatingUseCase(repository=repo)
    assert uc.execute(user_id=1, external_id="rawg-999") is None
