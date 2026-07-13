import pytest

from app.modules.game_lists.application.delete_game_list import DeleteGameListUseCase
from app.modules.game_lists.domain.exceptions import GameListNotFound
from tests.conftest import FakeGameListRepository


def test_delete_removes_list():
    repo = FakeGameListRepository()
    created = repo.create(user_id=42, name="RPGs", description=None)

    uc = DeleteGameListUseCase(repository=repo)
    uc.execute(user_id=42, list_id=created.id)

    assert repo.list_by_user(42) == []


def test_delete_missing_list_raises():
    repo = FakeGameListRepository()
    uc = DeleteGameListUseCase(repository=repo)

    with pytest.raises(GameListNotFound):
        uc.execute(user_id=42, list_id=999)


def test_delete_other_users_list_raises():
    repo = FakeGameListRepository()
    created = repo.create(user_id=99, name="RPGs", description=None)

    uc = DeleteGameListUseCase(repository=repo)
    with pytest.raises(GameListNotFound):
        uc.execute(user_id=42, list_id=created.id)
