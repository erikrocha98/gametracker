from app.modules.game_lists.application.get_user_lists import GetUserListsUseCase
from tests.conftest import FakeGameCatalog, FakeGameListItemRepository, FakeGameListRepository


def _make_uc(repo=None, items=None, catalog=None):
    return GetUserListsUseCase(
        repository=repo or FakeGameListRepository(),
        item_repository=items or FakeGameListItemRepository(),
        game_catalog=catalog or FakeGameCatalog(),
    )


def test_get_lists_empty():
    uc = _make_uc()
    assert uc.execute(42) == []


def test_get_lists_filters_by_user():
    repo = FakeGameListRepository()
    repo.create(user_id=42, name="RPGs", description=None)
    repo.create(user_id=99, name="FPS", description=None)

    uc = _make_uc(repo=repo)
    result = uc.execute(42)

    assert len(result) == 1
    assert result[0].game_list.user_id == 42


def test_get_lists_includes_game_count():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    game_list = repo.create(user_id=1, name="RPGs", description=None)
    items.add(list_id=game_list.id, game_id=10)
    items.add(list_id=game_list.id, game_id=11)

    uc = _make_uc(repo=repo, items=items)
    result = uc.execute(1)

    assert result[0].game_count == 2


def test_get_lists_without_game_id_contains_game_is_none():
    repo = FakeGameListRepository()
    repo.create(user_id=1, name="RPGs", description=None)

    uc = _make_uc(repo=repo)
    result = uc.execute(1)

    assert result[0].contains_game is None


def test_get_lists_with_game_id_flag_true_when_game_in_list():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    game_list = repo.create(user_id=1, name="RPGs", description=None)
    internal_id = catalog.register("rawg-100")
    items.add(list_id=game_list.id, game_id=internal_id)

    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    result = uc.execute(1, contains_external_id="rawg-100")

    assert result[0].contains_game is True


def test_get_lists_with_game_id_flag_false_when_game_not_in_list():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    catalog = FakeGameCatalog()
    repo.create(user_id=1, name="RPGs", description=None)
    catalog.register("rawg-100")

    uc = _make_uc(repo=repo, items=items, catalog=catalog)
    result = uc.execute(1, contains_external_id="rawg-100")

    assert result[0].contains_game is False


def test_get_lists_with_unregistered_game_all_flags_false():
    repo = FakeGameListRepository()
    repo.create(user_id=1, name="RPGs", description=None)
    repo.create(user_id=1, name="FPS", description=None)

    uc = _make_uc(repo=repo)
    result = uc.execute(1, contains_external_id="rawg-9999")

    assert all(p.contains_game is False for p in result)
