import pytest

from app.modules.game_lists.application.update_game_list import UpdateGameListUseCase
from app.modules.game_lists.domain.exceptions import GameListNotFound
from tests.conftest import FakeGameListRepository


def test_update_changes_name_and_description():
    repo = FakeGameListRepository()
    created = repo.create(user_id=42, name="RPGs", description=None)

    uc = UpdateGameListUseCase(repository=repo)
    result = uc.execute(user_id=42, list_id=created.id, name="RPGs favoritos", description="top")

    assert result.name == "RPGs favoritos"
    assert result.description == "top"


def test_update_missing_list_raises():
    repo = FakeGameListRepository()
    uc = UpdateGameListUseCase(repository=repo)

    with pytest.raises(GameListNotFound):
        uc.execute(user_id=42, list_id=999, name="x", description=None)


def test_update_other_users_list_raises():
    repo = FakeGameListRepository()
    created = repo.create(user_id=99, name="RPGs", description=None)

    uc = UpdateGameListUseCase(repository=repo)
    with pytest.raises(GameListNotFound):
        uc.execute(user_id=42, list_id=created.id, name="x", description=None)
