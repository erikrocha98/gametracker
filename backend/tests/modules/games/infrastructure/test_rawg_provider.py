import pytest
import requests

from app.modules.games.domain.exceptions import GameProviderNotConfigured, GameProviderUnavailable
from app.modules.games.infrastructure.rawg_provider import RawgGameSearchProvider

_RAWG_RESPONSE = {
    "results": [
        {
            "id": 3498,
            "name": "Grand Theft Auto V",
            "background_image": "https://media.rawg.io/cover.jpg",
            "released": "2013-09-17",
            "platforms": [
                {"platform": {"name": "PlayStation 5"}},
                {"platform": {"name": "PC"}},
            ],
        }
    ]
}


def test_raises_not_configured_when_api_key_is_empty():
    with pytest.raises(GameProviderNotConfigured):
        RawgGameSearchProvider(api_key="")


def test_maps_rawg_response_correctly(mocker):
    mock_get = mocker.patch("requests.get")
    mock_get.return_value.json.return_value = _RAWG_RESPONSE
    mock_get.return_value.raise_for_status = lambda: None

    provider = RawgGameSearchProvider(api_key="key")
    results = provider.search("gta")

    assert len(results) == 1
    result = results[0]
    assert result.id == "rawg-3498"
    assert result.name == "Grand Theft Auto V"
    assert result.cover_url == "https://media.rawg.io/cover.jpg"
    assert result.platforms == ["PlayStation 5", "PC"]
    assert result.release_year == 2013


def test_cover_url_is_none_when_background_image_absent(mocker):
    mock_get = mocker.patch("requests.get")
    mock_get.return_value.json.return_value = {
        "results": [{"id": 1, "name": "Game", "background_image": None, "released": "2020-01-01", "platforms": []}]
    }
    mock_get.return_value.raise_for_status = lambda: None

    provider = RawgGameSearchProvider(api_key="key")
    results = provider.search("game")
    assert results[0].cover_url is None


def test_release_year_is_none_when_released_absent(mocker):
    mock_get = mocker.patch("requests.get")
    mock_get.return_value.json.return_value = {
        "results": [{"id": 1, "name": "Game", "background_image": None, "released": None, "platforms": []}]
    }
    mock_get.return_value.raise_for_status = lambda: None

    provider = RawgGameSearchProvider(api_key="key")
    results = provider.search("game")
    assert results[0].release_year is None


def test_platforms_empty_when_absent(mocker):
    mock_get = mocker.patch("requests.get")
    mock_get.return_value.json.return_value = {
        "results": [{"id": 1, "name": "Game", "background_image": None, "released": None}]
    }
    mock_get.return_value.raise_for_status = lambda: None

    provider = RawgGameSearchProvider(api_key="key")
    results = provider.search("game")
    assert results[0].platforms == []


def test_timeout_raises_provider_unavailable(mocker):
    mocker.patch("requests.get", side_effect=requests.exceptions.Timeout)
    provider = RawgGameSearchProvider(api_key="key")
    with pytest.raises(GameProviderUnavailable):
        provider.search("gta")


def test_connection_error_raises_provider_unavailable(mocker):
    mocker.patch("requests.get", side_effect=requests.exceptions.ConnectionError)
    provider = RawgGameSearchProvider(api_key="key")
    with pytest.raises(GameProviderUnavailable):
        provider.search("gta")


def test_http_500_raises_provider_unavailable(mocker):
    mock_response = mocker.MagicMock()
    mock_response.status_code = 500
    http_error = requests.exceptions.HTTPError(response=mock_response)
    mock_response.raise_for_status.side_effect = http_error
    mocker.patch("requests.get", return_value=mock_response)

    provider = RawgGameSearchProvider(api_key="key")
    with pytest.raises(GameProviderUnavailable):
        provider.search("gta")


def test_http_4xx_returns_empty(mocker):
    mock_response = mocker.MagicMock()
    mock_response.status_code = 404
    http_error = requests.exceptions.HTTPError(response=mock_response)
    mock_response.raise_for_status.side_effect = http_error
    mocker.patch("requests.get", return_value=mock_response)

    provider = RawgGameSearchProvider(api_key="key")
    results = provider.search("gta")
    assert results == []
