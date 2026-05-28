import pytest

from app.modules.games.application.remove_game_from_collection import RemoveGameFromCollectionUseCase
from app.modules.games.domain.exceptions import GameNotInCollection
from tests.conftest import FakeUserGameRepository

EXTERNAL_ID = "rawg-3328"
INTERNAL_ID = 1


def _make_repo_with_game(user_id: int) -> FakeUserGameRepository:
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    repo.add(user_id=user_id, game_id=INTERNAL_ID)
    return repo


def test_remove_game_success():
    repo = _make_repo_with_game(user_id=42)
    uc = RemoveGameFromCollectionUseCase(repository=repo)
    uc.execute(user_id=42, external_id=EXTERNAL_ID)
    assert len(repo._rows) == 0


def test_remove_game_not_in_collection_raises():
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID

    uc = RemoveGameFromCollectionUseCase(repository=repo)
    with pytest.raises(GameNotInCollection):
        uc.execute(user_id=42, external_id=EXTERNAL_ID)


def test_remove_game_unknown_external_id_raises():
    repo = FakeUserGameRepository()

    uc = RemoveGameFromCollectionUseCase(repository=repo)
    with pytest.raises(GameNotInCollection):
        uc.execute(user_id=42, external_id="rawg-9999")
