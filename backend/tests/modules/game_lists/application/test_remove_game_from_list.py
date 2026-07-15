import pytest

from app.modules.game_lists.application.remove_game_from_list import RemoveGameFromListUseCase
from app.modules.game_lists.domain.exceptions import GameListNotFound, GameNotInList
from tests.conftest import FakeGameCatalog, FakeGameListItemRepository, FakeGameListRepository


def _make_uc(repo=None, items=None, catalog=None):
    return RemoveGameFromListUseCase(
        list_repository=repo or FakeGameListRepository(),
        item_repository=items or FakeGameListItemRepository(),
        game_catalog=catalog or FakeGameCatalog(),
    )


def test_remove_game_ok():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    game_list = repo.create(user_id=1, name="RPGs", description=None)
    internal_id = catalog.register("rawg-3328")
    items.add(list_id=game_list.id, game_id=internal_id)

    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-3328")

    assert items.count(game_list.id) == 0


def test_remove_game_list_not_owned_raises():
    repo = FakeGameListRepository()
    game_list = repo.create(user_id=99, name="RPGs", description=None)

    uc = _make_uc(repo=repo)
    with pytest.raises(GameListNotFound):
        uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-1")


def test_remove_unregistered_game_raises():
    repo = FakeGameListRepository()
    game_list = repo.create(user_id=1, name="RPGs", description=None)

    uc = _make_uc(repo=repo)
    with pytest.raises(GameNotInList):
        uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-9999")


def test_remove_game_not_added_to_list_raises():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    game_list = repo.create(user_id=1, name="RPGs", description=None)
    catalog.register("rawg-3328")

    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    with pytest.raises(GameNotInList):
        uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-3328")
