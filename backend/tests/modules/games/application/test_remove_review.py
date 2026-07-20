import pytest

from tests.conftest import FakeUserGameRepository
from app.modules.games.application.remove_review import RemoveReviewUseCase
from app.modules.games.domain.exceptions import GameNotInCollection


def test_remove_review_success():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10
    entry = repo.add(user_id=1, game_id=10)
    entry.review = "To be removed"

    uc = RemoveReviewUseCase(repository=repo)
    uc.execute(user_id=1, external_id="rawg-1")

    assert repo.get(user_id=1, game_id=10).review is None


def test_remove_review_unknown_game_raises():
    repo = FakeUserGameRepository()

    uc = RemoveReviewUseCase(repository=repo)
    with pytest.raises(GameNotInCollection):
        uc.execute(user_id=1, external_id="rawg-999")


def test_remove_review_game_not_in_collection_raises():
    repo = FakeUserGameRepository()
    repo.internal_ids["rawg-1"] = 10

    uc = RemoveReviewUseCase(repository=repo)
    with pytest.raises(GameNotInCollection):
        uc.execute(user_id=1, external_id="rawg-1")
