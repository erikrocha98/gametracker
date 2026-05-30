from datetime import date, datetime, timezone

import pytest

from app.modules.games.domain.entities import GameDetail, UserGame


_DETAIL = GameDetail(
    id="rawg-3328",
    name="The Witcher 3",
    description=None,
    release_date=date(2015, 5, 19),
    cover_url="https://example.com/cover.jpg",
    genres=[],
    platforms=["PC"],
    developers=[],
    rawg_rating=None,
    screenshots=[],
)

EXTERNAL_ID = "rawg-3328"
INTERNAL_ID = 7


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


def _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo):
    fake_game_detail_provider._detail = _DETAIL
    fake_game_repo._stored[EXTERNAL_ID] = _DETAIL
    fake_user_game_repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID


# ── POST /games/want-to-play ───────────────────────────────────────────────


def test_add_to_collection_returns_201(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo)
    _login(api_client)

    resp = api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})
    assert resp.status_code == 201
    data = resp.json()
    assert data["gameId"] == EXTERNAL_ID


def test_add_to_collection_409_when_already_added(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo)
    _login(api_client)

    api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})
    resp = api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})
    assert resp.status_code == 409


def test_add_to_collection_404_when_game_not_found(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    from app.modules.games.domain.exceptions import GameNotFound

    fake_game_detail_provider._raise = GameNotFound
    _login(api_client)

    resp = api_client.post("/games/want-to-play", json={"gameId": "rawg-9999"})
    assert resp.status_code == 404


def test_add_to_collection_401_without_auth(api_client):
    resp = api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})
    assert resp.status_code == 401


# ── DELETE /games/want-to-play/{game_id} ──────────────────────────────────


def test_remove_from_collection_returns_204(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo)
    _login(api_client)
    api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})

    resp = api_client.delete(f"/games/want-to-play/{EXTERNAL_ID}")
    assert resp.status_code == 204


def test_remove_from_collection_404_not_in_collection(
    api_client, fake_user_game_repo
):
    fake_user_game_repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID
    _login(api_client)

    resp = api_client.delete(f"/games/want-to-play/{EXTERNAL_ID}")
    assert resp.status_code == 404


def test_remove_from_collection_401_without_auth(api_client):
    resp = api_client.delete(f"/games/want-to-play/{EXTERNAL_ID}")
    assert resp.status_code == 401


# ── GET /games/collection ─────────────────────────────────────────────────


def test_get_collection_returns_items(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo)
    _login(api_client)
    api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})

    resp = api_client.get("/games/collection")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["gameId"] == EXTERNAL_ID


def test_get_collection_returns_empty_list(api_client):
    _login(api_client)
    resp = api_client.get("/games/collection")
    assert resp.status_code == 200
    assert resp.json()["items"] == []


def test_get_collection_401_without_auth(api_client):
    resp = api_client.get("/games/collection")
    assert resp.status_code == 401


def test_get_collection_filters_by_status_want_to_play(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo)
    _login(api_client)
    api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})

    resp = api_client.get("/games/collection?status=want_to_play")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


def test_get_collection_filters_by_status_finished_returns_empty(
    api_client, fake_game_detail_provider, fake_game_repo, fake_user_game_repo
):
    _seed(fake_game_detail_provider, fake_game_repo, fake_user_game_repo)
    _login(api_client)
    api_client.post("/games/want-to-play", json={"gameId": EXTERNAL_ID})

    resp = api_client.get("/games/collection?status=finished")
    assert resp.status_code == 200
    assert resp.json()["items"] == []


def test_get_collection_invalid_status_returns_422(api_client):
    _login(api_client)
    resp = api_client.get("/games/collection?status=invalid_value")
    assert resp.status_code == 422
