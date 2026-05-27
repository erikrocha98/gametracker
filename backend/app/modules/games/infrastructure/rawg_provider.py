import logging
from datetime import datetime

import requests

from app.modules.games.domain.entities import GameDetail, GameSearchResult
from app.modules.games.domain.exceptions import (
    GameNotFound,
    GameProviderNotConfigured,
    GameProviderUnavailable,
)

_RAWG_BASE_URL = "https://api.rawg.io/api/games"
_logger = logging.getLogger(__name__)


class RawgGameSearchProvider:
    def __init__(self, api_key: str, timeout_seconds: float = 5.0) -> None:
        if not api_key:
            raise GameProviderNotConfigured
        self._api_key = api_key
        self._timeout = timeout_seconds

    def search(self, query: str) -> list[GameSearchResult]:
        try:
            response = requests.get(
                _RAWG_BASE_URL,
                params={"key": self._api_key, "search": query, "page_size": 20},
                timeout=self._timeout,
            )
            response.raise_for_status()
        except requests.exceptions.Timeout:
            raise GameProviderUnavailable
        except requests.exceptions.ConnectionError:
            raise GameProviderUnavailable
        except requests.exceptions.HTTPError as exc:
            if exc.response is not None and exc.response.status_code < 500:
                return []
            raise GameProviderUnavailable from exc

        return [self._map(item) for item in response.json().get("results", [])]

    def _map(self, item: dict) -> GameSearchResult:
        released = item.get("released")
        try:
            release_year = int(released[:4]) if released else None
        except (ValueError, TypeError):
            release_year = None

        return GameSearchResult(
            id=f"rawg-{item['id']}",
            name=item["name"],
            cover_url=item.get("background_image"),
            platforms=[p["platform"]["name"] for p in (item.get("platforms") or [])],
            release_year=release_year,
        )


class RawgGameDetailProvider:
    def __init__(self, api_key: str, timeout_seconds: float = 5.0) -> None:
        if not api_key:
            raise GameProviderNotConfigured
        self._api_key = api_key
        self._timeout = timeout_seconds

    def get_by_id(self, game_id: str) -> GameDetail:
        rawg_id = game_id.split("-", 1)[1] if "-" in game_id else game_id
        detail_data = self._fetch_detail(rawg_id)
        screenshots = self._fetch_screenshots(rawg_id, game_id)
        return self._map(game_id, detail_data, screenshots)

    def _fetch_detail(self, rawg_id: str) -> dict:
        try:
            response = requests.get(
                f"{_RAWG_BASE_URL}/{rawg_id}",
                params={"key": self._api_key},
                timeout=self._timeout,
            )
            response.raise_for_status()
        except requests.exceptions.Timeout:
            raise GameProviderUnavailable
        except requests.exceptions.ConnectionError:
            raise GameProviderUnavailable
        except requests.exceptions.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 404:
                raise GameNotFound from exc
            raise GameProviderUnavailable from exc
        return response.json()

    def _fetch_screenshots(self, rawg_id: str, game_id: str) -> list[str]:
        try:
            response = requests.get(
                f"{_RAWG_BASE_URL}/{rawg_id}/screenshots",
                params={"key": self._api_key, "page_size": 10},
                timeout=self._timeout,
            )
            response.raise_for_status()
            return [r["image"] for r in response.json().get("results", [])]
        except Exception:
            _logger.warning("Failed to fetch screenshots for %s", game_id)
            return []

    def _map(self, game_id: str, data: dict, screenshots: list[str]) -> GameDetail:
        released = data.get("released")
        release_date = None
        if released:
            try:
                release_date = datetime.strptime(released, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                pass

        description = data.get("description_raw") or data.get("description") or None

        return GameDetail(
            id=game_id,
            name=data["name"],
            description=description,
            release_date=release_date,
            cover_url=data.get("background_image"),
            genres=[g["name"] for g in (data.get("genres") or [])],
            platforms=[p["platform"]["name"] for p in (data.get("platforms") or [])],
            developers=[d["name"] for d in (data.get("developers") or [])],
            rawg_rating=data.get("rating"),
            screenshots=screenshots,
        )
