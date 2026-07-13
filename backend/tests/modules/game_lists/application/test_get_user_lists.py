from app.modules.game_lists.application.get_user_lists import GetUserListsUseCase
from tests.conftest import FakeGameListRepository


def test_get_lists_empty():
    repo = FakeGameListRepository()
    uc = GetUserListsUseCase(repository=repo)

    assert uc.execute(42) == []


def test_get_lists_filters_by_user():
    repo = FakeGameListRepository()
    repo.create(user_id=42, name="RPGs", description=None)
    repo.create(user_id=99, name="FPS", description=None)

    uc = GetUserListsUseCase(repository=repo)
    result = uc.execute(42)

    assert len(result) == 1
    assert result[0].user_id == 42
