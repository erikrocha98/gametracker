import pytest

from app.modules.game_lists.application.add_game_to_list import AddGameToListUseCase
from app.modules.game_lists.domain.entities import MAX_GAMES_PER_LIST
from app.modules.game_lists.domain.exceptions import GameAlreadyInList, GameListFull, GameListNotFound
from tests.conftest import FakeGameCatalog, FakeGameListItemRepository, FakeGameListRepository


def _make_uc(repo=None, items=None, catalog=None):
    return AddGameToListUseCase(
        list_repository=repo or FakeGameListRepository(),
        item_repository=items or FakeGameListItemRepository(),
        game_catalog=catalog or FakeGameCatalog(),
    )


def test_add_game_returns_listed_game():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    game_list = repo.create(user_id=1, name="RPGs", description=None)

    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    result = uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-3328")

    assert result.game_id == "fake-1"
    assert items.count(game_list.id) == 1


def test_add_game_list_not_owned_raises():
    repo = FakeGameListRepository()
    game_list = repo.create(user_id=99, name="RPGs", description=None)

    uc = _make_uc(repo=repo)
    with pytest.raises(GameListNotFound):
        uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-1")


def test_add_duplicate_game_raises():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    game_list = repo.create(user_id=1, name="RPGs", description=None)
    internal_id = catalog.register("rawg-3328")
    items.add(list_id=game_list.id, game_id=internal_id)

    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    with pytest.raises(GameAlreadyInList):
        uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-3328")


def test_add_game_when_list_is_full_raises():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    game_list = repo.create(user_id=1, name="RPGs", description=None)

    for i in range(MAX_GAMES_PER_LIST):
        internal_id = catalog.register(f"rawg-{i}")
        items.add(list_id=game_list.id, game_id=internal_id)

    catalog.register("rawg-9999")
    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    with pytest.raises(GameListFull):
        uc.execute(user_id=1, list_id=game_list.id, external_id="rawg-9999")
