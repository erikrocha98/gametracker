from datetime import datetime, timezone

from app.modules.game_lists.domain.entities import ListedGame, MAX_GAMES_PER_LIST
from app.modules.games.domain.exceptions import GameNotFound
from tests.conftest import FakeGameCatalog, FakeGameListItemRepository, FakeGameListRepository


def _login(api_client):
    api_client.post(
        "/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "senha!123"},
    )
    resp = api_client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "senha!123"},
    )
    assert resp.status_code == 200


def _create_list(api_client, name="RPGs"):
    return api_client.post("/lists", json={"name": name}).json()


# ── POST /lists/{list_id}/games ────────────────────────────────────────────


def test_add_game_returns_201_with_camelcase(api_client):
    _login(api_client)
    lst = _create_list(api_client)

    resp = api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-3328"})

    assert resp.status_code == 201
    data = resp.json()
    assert "gameId" in data
    assert "name" in data
    assert "addedAt" in data


def test_add_game_returns_409_when_already_in_list(api_client):
    _login(api_client)
    lst = _create_list(api_client)
    api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-3328"})

    resp = api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-3328"})

    assert resp.status_code == 409


def test_add_game_returns_422_when_list_is_full(
    api_client, fake_game_list_item_repo: FakeGameListItemRepository
):
    _login(api_client)
    lst = _create_list(api_client)
    list_id = lst["id"]

    # Pre-populate with MAX_GAMES_PER_LIST items using game_ids that won't clash
    # with the next ensure_game assignment (catalog starts at internal_id=1).
    for i in range(MAX_GAMES_PER_LIST):
        fake_game_list_item_repo._items[(list_id, 100 + i)] = ListedGame(
            game_id=f"rawg-{100 + i}",
            name=f"Game {i}",
            cover_url=None,
            platforms=[],
            release_year=None,
            added_at=datetime.now(timezone.utc),
        )

    resp = api_client.post(f"/lists/{list_id}/games", json={"gameId": "rawg-9999"})

    assert resp.status_code == 422


def test_add_game_returns_404_for_other_users_list(
    api_client, fake_game_list_repo: FakeGameListRepository
):
    fake_game_list_repo.create(user_id=999, name="Alheia", description=None)
    other_list_id = fake_game_list_repo.list_by_user(999)[0].id
    _login(api_client)

    resp = api_client.post(f"/lists/{other_list_id}/games", json={"gameId": "rawg-1"})

    assert resp.status_code == 404


def test_add_game_returns_404_for_unknown_game(
    api_client, fake_game_catalog: FakeGameCatalog
):
    _login(api_client)
    lst = _create_list(api_client)
    fake_game_catalog.fail_ensure_with = GameNotFound

    resp = api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-0"})

    assert resp.status_code == 404


def test_add_game_returns_401_without_auth(api_client):
    resp = api_client.post("/lists/1/games", json={"gameId": "rawg-1"})
    assert resp.status_code == 401


# ── DELETE /lists/{list_id}/games/{game_id} ────────────────────────────────


def test_remove_game_returns_204(api_client):
    _login(api_client)
    lst = _create_list(api_client)
    api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-3328"})

    resp = api_client.delete(f"/lists/{lst['id']}/games/rawg-3328")

    assert resp.status_code == 204


def test_remove_game_returns_404_when_not_in_list(api_client):
    _login(api_client)
    lst = _create_list(api_client)

    resp = api_client.delete(f"/lists/{lst['id']}/games/rawg-9999")

    assert resp.status_code == 404


def test_remove_game_returns_401_without_auth(api_client):
    resp = api_client.delete("/lists/1/games/rawg-1")
    assert resp.status_code == 401


# ── GET /lists/{list_id} ───────────────────────────────────────────────────


def test_get_list_returns_200_with_games(api_client):
    _login(api_client)
    lst = _create_list(api_client)
    api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-3328"})

    resp = api_client.get(f"/lists/{lst['id']}")

    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == lst["id"]
    assert data["gameCount"] == 1
    assert len(data["items"]) == 1
    assert "gameId" in data["items"][0]


def test_get_list_returns_404_for_other_users_list(
    api_client, fake_game_list_repo: FakeGameListRepository
):
    fake_game_list_repo.create(user_id=999, name="Alheia", description=None)
    other_list_id = fake_game_list_repo.list_by_user(999)[0].id
    _login(api_client)

    resp = api_client.get(f"/lists/{other_list_id}")

    assert resp.status_code == 404


def test_get_list_returns_401_without_auth(api_client):
    resp = api_client.get("/lists/1")
    assert resp.status_code == 401


# ── GET /lists?gameId= ─────────────────────────────────────────────────────


def test_get_lists_contains_game_flag_true_when_game_in_list(api_client):
    _login(api_client)
    lst = _create_list(api_client)
    api_client.post(f"/lists/{lst['id']}/games", json={"gameId": "rawg-3328"})

    resp = api_client.get("/lists?gameId=rawg-3328")

    assert resp.status_code == 200
    assert resp.json()["items"][0]["containsGame"] is True


def test_get_lists_contains_game_flag_false_when_game_not_in_list(api_client):
    _login(api_client)
    _create_list(api_client)

    resp = api_client.get("/lists?gameId=rawg-9999")

    assert resp.status_code == 200
    assert resp.json()["items"][0]["containsGame"] is False


def test_get_lists_contains_game_is_null_without_game_id(api_client):
    _login(api_client)
    _create_list(api_client)

    resp = api_client.get("/lists")

    assert resp.status_code == 200
    assert resp.json()["items"][0]["containsGame"] is None


def test_get_lists_returns_game_count_and_cover_urls(
    api_client, fake_game_list_item_repo: FakeGameListItemRepository
):
    _login(api_client)
    lst = _create_list(api_client)
    list_id = lst["id"]

    fake_game_list_item_repo._items[(list_id, 1)] = ListedGame(
        game_id="rawg-1",
        name="The Witcher 3",
        cover_url="https://example.com/cover.jpg",
        platforms=["PC"],
        release_year=2015,
        added_at=datetime.now(timezone.utc),
    )

    resp = api_client.get("/lists")

    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert item["gameCount"] == 1
    assert item["coverUrls"] == ["https://example.com/cover.jpg"]


def test_get_lists_with_game_id_returns_401_without_auth(api_client):
    resp = api_client.get("/lists?gameId=rawg-1")
    assert resp.status_code == 401
