from datetime import date

import pytest

from app.modules.games.domain.entities import GameDetail


_DETAIL = GameDetail(
    id="rawg-1",
    name="Test Game",
    description=None,
    release_date=None,
    cover_url=None,
    genres=[],
    platforms=[],
    developers=[],
    rawg_rating=None,
    screenshots=[],
)


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


def _seed(fake_game_detail_provider, fake_user_game_repo, with_entry: bool = True):
    fake_game_detail_provider._detail = _DETAIL
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    if with_entry:
        fake_user_game_repo.add(user_id=1, game_id=10)


# ── PUT /games/{game_id}/rating ────────────────────────────────────────────

def test_put_rating_returns_200(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.put("/games/rawg-1/rating", json={"rating": 4.5})
    assert resp.status_code == 200
    data = resp.json()
    assert data["rating"] == 4.5


def test_put_rating_invalid_value_returns_422(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.put("/games/rawg-1/rating", json={"rating": 0.3})
    assert resp.status_code == 422


def test_put_rating_auto_adds_to_collection(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo, with_entry=False)

    resp = api_client.put("/games/rawg-1/rating", json={"rating": 3.0})
    assert resp.status_code == 200
    assert fake_user_game_repo.exists(user_id=1, game_id=10)


# ── DELETE /games/{game_id}/rating ────────────────────────────────────────

def test_delete_rating_returns_204(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)
    entry = fake_user_game_repo.get(user_id=1, game_id=10)
    entry.rating = 4.0

    resp = api_client.delete("/games/rawg-1/rating")
    assert resp.status_code == 204
    assert fake_user_game_repo.get(user_id=1, game_id=10).rating is None


def test_delete_rating_not_in_collection_returns_404(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    fake_user_game_repo.internal_ids["rawg-1"] = 10

    resp = api_client.delete("/games/rawg-1/rating")
    assert resp.status_code == 404


# ── GET /games/{game_id} with userRating ──────────────────────────────────

def test_get_game_details_returns_user_rating(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)
    entry = fake_user_game_repo.get(user_id=1, game_id=10)
    entry.rating = 3.5

    resp = api_client.get("/games/rawg-1")
    assert resp.status_code == 200
    assert resp.json()["userRating"] == 3.5


def test_get_game_details_user_rating_is_null_when_not_rated(api_client, fake_game_detail_provider, fake_user_game_repo):
    _login(api_client)
    _seed(fake_game_detail_provider, fake_user_game_repo)

    resp = api_client.get("/games/rawg-1")
    assert resp.status_code == 200
    assert resp.json()["userRating"] is None
