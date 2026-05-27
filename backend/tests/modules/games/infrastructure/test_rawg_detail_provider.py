from datetime import date

import pytest
import requests

from app.modules.games.domain.exceptions import GameNotFound, GameProviderUnavailable
from app.modules.games.infrastructure.rawg_provider import RawgGameDetailProvider

_DETAIL_RESPONSE = {
    "id": 3498,
    "name": "The Witcher 3: Wild Hunt",
    "description_raw": "Open world RPG",
    "description": "<p>Open world RPG</p>",
    "released": "2015-05-19",
    "background_image": "https://media.rawg.io/cover.jpg",
    "rating": 4.6,
    "genres": [{"name": "RPG"}, {"name": "Adventure"}],
    "platforms": [{"platform": {"name": "PC"}}, {"platform": {"name": "PlayStation 4"}}],
    "developers": [{"name": "CD Projekt Red"}],
}

_SCREENSHOTS_RESPONSE = {
    "results": [
        {"image": "https://media.rawg.io/s1.jpg"},
        {"image": "https://media.rawg.io/s2.jpg"},
    ]
}


def _mock_responses(mocker, detail=_DETAIL_RESPONSE, screenshots=_SCREENSHOTS_RESPONSE, screenshot_status=200):
    def side_effect(url, **kwargs):
        mock = mocker.MagicMock()
        if "screenshots" in url:
            if screenshot_status >= 400:
                mock.raise_for_status.side_effect = requests.exceptions.HTTPError(
                    response=mocker.MagicMock(status_code=screenshot_status)
                )
            else:
                mock.raise_for_status = lambda: None
                mock.json.return_value = screenshots
        else:
            mock.raise_for_status = lambda: None
            mock.json.return_value = detail
        return mock

    mocker.patch("requests.get", side_effect=side_effect)


def test_maps_happy_path_correctly(mocker):
    _mock_responses(mocker)
    provider = RawgGameDetailProvider(api_key="key")
    result = provider.get_by_id("rawg-3498")

    assert result.id == "rawg-3498"
    assert result.name == "The Witcher 3: Wild Hunt"
    assert result.description == "Open world RPG"
    assert result.release_date == date(2015, 5, 19)
    assert result.cover_url == "https://media.rawg.io/cover.jpg"
    assert result.rawg_rating == 4.6
    assert result.genres == ["RPG", "Adventure"]
    assert result.platforms == ["PC", "PlayStation 4"]
    assert result.developers == ["CD Projekt Red"]
    assert result.screenshots == ["https://media.rawg.io/s1.jpg", "https://media.rawg.io/s2.jpg"]


def test_404_raises_game_not_found(mocker):
    mock_response = mocker.MagicMock()
    mock_response.status_code = 404
    http_error = requests.exceptions.HTTPError(response=mock_response)
    mock_response.raise_for_status.side_effect = http_error
    mocker.patch("requests.get", return_value=mock_response)

    provider = RawgGameDetailProvider(api_key="key")
    with pytest.raises(GameNotFound):
        provider.get_by_id("rawg-999999")


def test_5xx_raises_provider_unavailable(mocker):
    mock_response = mocker.MagicMock()
    mock_response.status_code = 500
    http_error = requests.exceptions.HTTPError(response=mock_response)
    mock_response.raise_for_status.side_effect = http_error
    mocker.patch("requests.get", return_value=mock_response)

    provider = RawgGameDetailProvider(api_key="key")
    with pytest.raises(GameProviderUnavailable):
        provider.get_by_id("rawg-3498")


def test_timeout_raises_provider_unavailable(mocker):
    mocker.patch("requests.get", side_effect=requests.exceptions.Timeout)
    provider = RawgGameDetailProvider(api_key="key")
    with pytest.raises(GameProviderUnavailable):
        provider.get_by_id("rawg-3498")


def test_screenshot_failure_returns_empty_screenshots(mocker):
    _mock_responses(mocker, screenshot_status=500)
    provider = RawgGameDetailProvider(api_key="key")
    result = provider.get_by_id("rawg-3498")

    assert result.name == "The Witcher 3: Wild Hunt"
    assert result.screenshots == []


def test_missing_released_gives_none_release_date(mocker):
    detail = {**_DETAIL_RESPONSE, "released": None}
    _mock_responses(mocker, detail=detail)
    provider = RawgGameDetailProvider(api_key="key")
    result = provider.get_by_id("rawg-3498")
    assert result.release_date is None


def test_malformed_released_gives_none_release_date(mocker):
    detail = {**_DETAIL_RESPONSE, "released": "not-a-date"}
    _mock_responses(mocker, detail=detail)
    provider = RawgGameDetailProvider(api_key="key")
    result = provider.get_by_id("rawg-3498")
    assert result.release_date is None


def test_falls_back_to_description_when_description_raw_absent(mocker):
    detail = {**_DETAIL_RESPONSE, "description_raw": None}
    _mock_responses(mocker, detail=detail)
    provider = RawgGameDetailProvider(api_key="key")
    result = provider.get_by_id("rawg-3498")
    assert result.description == "<p>Open world RPG</p>"
