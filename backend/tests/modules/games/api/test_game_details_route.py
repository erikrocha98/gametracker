from datetime import date

import pytest

from app.modules.games.domain.entities import GameDetail
from app.modules.games.domain.exceptions import GameNotFound, GameProviderUnavailable

_DETAIL = GameDetail(
    id="rawg-3498",
    name="The Witcher 3",
    description="Open world RPG",
    release_date=date(2015, 5, 19),
    cover_url="https://example.com/cover.jpg",
    genres=["RPG"],
    platforms=["PC", "PS4"],
    developers=["CD Projekt Red"],
    rawg_rating=4.6,
    screenshots=["https://example.com/s1.jpg"],
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


def test_get_details_without_auth_returns_401(api_client):
    response = api_client.get("/games/rawg-3498")
    assert response.status_code == 401


def test_get_details_returns_200_with_camel_case_payload(api_client, fake_game_detail_provider, fake_game_repo):
    fake_game_detail_provider._detail = _DETAIL
    _login(api_client)
    response = api_client.get("/games/rawg-3498")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "rawg-3498"
    assert data["name"] == "The Witcher 3"
    assert data["description"] == "Open world RPG"
    assert data["releaseDate"] == "2015-05-19"
    assert data["coverUrl"] == "https://example.com/cover.jpg"
    assert data["genres"] == ["RPG"]
    assert data["platforms"] == ["PC", "PS4"]
    assert data["developers"] == ["CD Projekt Red"]
    assert data["rawgRating"] == 4.6
    assert data["platformAverageRating"] is None
    assert data["screenshots"] == ["https://example.com/s1.jpg"]


def test_get_details_returns_404_when_game_not_found(api_client, fake_game_detail_provider):
    fake_game_detail_provider._raise = GameNotFound
    _login(api_client)
    response = api_client.get("/games/rawg-999999")
    assert response.status_code == 404


def test_get_details_returns_502_when_provider_unavailable(api_client, fake_game_detail_provider):
    fake_game_detail_provider._raise = GameProviderUnavailable
    _login(api_client)
    response = api_client.get("/games/rawg-3498")
    assert response.status_code == 502


def test_cache_hit_does_not_call_provider(api_client, fake_game_detail_provider, fake_game_repo):
    fake_game_repo._stored["rawg-3498"] = _DETAIL
    _login(api_client)
    response = api_client.get("/games/rawg-3498")

    assert response.status_code == 200
    assert fake_game_detail_provider.calls == []
