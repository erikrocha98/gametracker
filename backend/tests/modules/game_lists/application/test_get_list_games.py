from datetime import datetime, timezone

import pytest

from app.modules.game_lists.application.get_list_games import GetListGamesUseCase
from app.modules.game_lists.domain.entities import ListedGame
from app.modules.game_lists.domain.exceptions import GameListNotFound
from tests.conftest import FakeGameListItemRepository, FakeGameListRepository


def _make_uc(repo=None, items=None):
    return GetListGamesUseCase(
        list_repository=repo or FakeGameListRepository(),
        item_repository=items or FakeGameListItemRepository(),
    )


def test_get_list_games_returns_list_and_items():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    game_list = repo.create(user_id=1, name="RPGs", description=None)
    items.add(list_id=game_list.id, game_id=10)

    uc = _make_uc(repo=repo, items=items)
    returned_list, games = uc.execute(user_id=1, list_id=game_list.id)

    assert returned_list.id == game_list.id
    assert len(games) == 1


def test_get_list_games_not_owned_raises():
    repo = FakeGameListRepository()
    game_list = repo.create(user_id=99, name="RPGs", description=None)

    uc = _make_uc(repo=repo)
    with pytest.raises(GameListNotFound):
        uc.execute(user_id=1, list_id=game_list.id)


def test_get_list_games_orders_by_added_at_desc():
    repo = FakeGameListRepository()
    items = FakeGameListItemRepository()
    game_list = repo.create(user_id=1, name="RPGs", description=None)

    older = ListedGame(game_id="rawg-1", name="Older", cover_url=None, platforms=[], release_year=None,
                       added_at=datetime(2026, 1, 1, tzinfo=timezone.utc))
    newer = ListedGame(game_id="rawg-2", name="Newer", cover_url=None, platforms=[], release_year=None,
                       added_at=datetime(2026, 6, 1, tzinfo=timezone.utc))

    items._items[(game_list.id, 1)] = older
    items._items[(game_list.id, 2)] = newer

    uc = _make_uc(repo=repo, items=items)
    _, games = uc.execute(user_id=1, list_id=game_list.id)

    assert games[0].name == "Newer"
    assert games[1].name == "Older"
