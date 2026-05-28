from app.modules.games.application.get_user_collection import GetUserCollectionUseCase
from tests.conftest import FakeUserGameRepository

EXTERNAL_ID = "rawg-3328"
INTERNAL_ID = 1


def test_get_collection_returns_user_items():
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    repo.add(user_id=42, game_id=INTERNAL_ID)

    uc = GetUserCollectionUseCase(repository=repo)
    result = uc.execute(42)

    assert len(result) == 1
    assert result[0].user_id == 42


def test_get_collection_empty():
    repo = FakeUserGameRepository()
    uc = GetUserCollectionUseCase(repository=repo)
    assert uc.execute(42) == []


def test_get_collection_filters_by_user():
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    repo.add(user_id=42, game_id=INTERNAL_ID)
    repo.add(user_id=99, game_id=INTERNAL_ID)

    uc = GetUserCollectionUseCase(repository=repo)
    result = uc.execute(42)

    assert len(result) == 1
    assert result[0].user_id == 42
