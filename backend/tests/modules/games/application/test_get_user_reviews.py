from tests.conftest import FakeUserGameRepository
from app.modules.games.application.get_user_reviews import GetUserReviewsUseCase


def test_get_user_reviews_filters_only_reviewed():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.internal_ids["rawg-2"] = 20
    reviewed = repo.add(user_id=1, game_id=10)
    reviewed.review = "Reviewed"
    repo.add(user_id=1, game_id=20)  # no review

    uc = GetUserReviewsUseCase(repository=repo)
    result = uc.execute(1)

    assert len(result) == 1
    assert result[0].game_id == 10


def test_get_user_reviews_empty():
    repo = FakeUserGameRepository()
    uc = GetUserReviewsUseCase(repository=repo)
    assert uc.execute(1) == []


def test_get_user_reviews_filters_by_user():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    mine = repo.add(user_id=1, game_id=10)
    mine.review = "Mine"
    other = repo.add(user_id=2, game_id=10)
    other.review = "Theirs"

    uc = GetUserReviewsUseCase(repository=repo)
    result = uc.execute(1)

    assert len(result) == 1
    assert result[0].user_id == 1


def test_get_user_reviews_preserves_repository_order():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    repo.internal_ids["rawg-2"] = 20
    first = repo.add(user_id=1, game_id=10)
    first.review = "First"
    second = repo.add(user_id=1, game_id=20)
    second.review = "Second"

    uc = GetUserReviewsUseCase(repository=repo)
    result = uc.execute(1)

    assert [r.game_id for r in result] == [10, 20]
