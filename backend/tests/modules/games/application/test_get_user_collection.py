from app.modules.games.application.get_user_collection import GetUserCollectionUseCase
from app.modules.games.domain.entities import UserGameStatus
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


def test_get_collection_without_status_returns_all():
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    repo.add(user_id=42, game_id=INTERNAL_ID, status=UserGameStatus.want_to_play)
    repo.add(user_id=42, game_id=INTERNAL_ID + 1, status=UserGameStatus.finished)

    uc = GetUserCollectionUseCase(repository=repo)
    result = uc.execute(42)

    assert len(result) == 2


def test_get_collection_filters_want_to_play():
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    repo.add(user_id=42, game_id=INTERNAL_ID, status=UserGameStatus.want_to_play)
    repo.add(user_id=42, game_id=INTERNAL_ID + 1, status=UserGameStatus.finished)

    uc = GetUserCollectionUseCase(repository=repo)
    result = uc.execute(42, status=UserGameStatus.want_to_play)

    assert len(result) == 1
    assert result[0].status == UserGameStatus.want_to_play


def test_get_collection_filters_finished():
    repo = FakeUserGameRepository()
    repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    repo.add(user_id=42, game_id=INTERNAL_ID, status=UserGameStatus.want_to_play)
    repo.add(user_id=42, game_id=INTERNAL_ID + 1, status=UserGameStatus.finished)

    uc = GetUserCollectionUseCase(repository=repo)
    result = uc.execute(42, status=UserGameStatus.finished)

    assert len(result) == 1
    assert result[0].status == UserGameStatus.finished
