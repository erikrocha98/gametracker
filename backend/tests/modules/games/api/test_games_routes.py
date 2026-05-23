import pytest

from app.modules.games.domain.entities import GameSearchResult
from app.modules.games.domain.exceptions import GameProviderUnavailable

_RESULT = GameSearchResult(
    id="rawg-3498",
    name="Grand Theft Auto V",
    cover_url="https://media.rawg.io/cover.jpg",
    platforms=["PlayStation 5", "PC"],
    release_year=2013,
)

_RESULT_NULL_FIELDS = GameSearchResult(
    id="rawg-1",
    name="Unknown Game",
    cover_url=None,
    platforms=[],
    release_year=None,
)


def _login(api_client):
    from app.core.security import create_access_token
    from datetime import timedelta

    api_client.post(
        "/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "senha!123"},
    )
    resp = api_client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "senha!123"},
    )
    assert resp.status_code == 200


def test_search_without_auth_returns_401(api_client):
    response = api_client.get("/games/search?q=gta")
    assert response.status_code == 401


def test_search_empty_q_returns_422(api_client):
    _login(api_client)
    response = api_client.get("/games/search?q=")
    assert response.status_code == 422


def test_search_missing_q_returns_422(api_client):
    _login(api_client)
    response = api_client.get("/games/search")
    assert response.status_code == 422


def test_search_single_char_returns_empty_results(api_client, fake_game_provider):
    fake_game_provider._results = [_RESULT]
    _login(api_client)
    response = api_client.get("/games/search?q=a")
    assert response.status_code == 200
    assert response.json() == {"results": []}


def test_search_returns_camel_case_payload(api_client, fake_game_provider):
    fake_game_provider._results = [_RESULT]
    _login(api_client)
    response = api_client.get("/games/search?q=gta")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    item = data["results"][0]
    assert item["id"] == "rawg-3498"
    assert item["name"] == "Grand Theft Auto V"
    assert item["coverUrl"] == "https://media.rawg.io/cover.jpg"
    assert item["platforms"] == ["PlayStation 5", "PC"]
    assert item["releaseYear"] == 2013


def test_search_null_fields_serialized_correctly(api_client, fake_game_provider):
    fake_game_provider._results = [_RESULT_NULL_FIELDS]
    _login(api_client)
    response = api_client.get("/games/search?q=unknown")
    assert response.status_code == 200
    item = response.json()["results"][0]
    assert item["coverUrl"] is None
    assert item["releaseYear"] is None
    assert item["platforms"] == []


def test_search_provider_unavailable_returns_502(api_client, fake_game_provider):
    fake_game_provider._raise = True
    _login(api_client)
    response = api_client.get("/games/search?q=gta")
    assert response.status_code == 502
