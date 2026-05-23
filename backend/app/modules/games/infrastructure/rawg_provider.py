import requests

from app.modules.games.domain.entities import GameSearchResult
from app.modules.games.domain.exceptions import GameProviderNotConfigured, GameProviderUnavailable

_RAWG_BASE_URL = "https://api.rawg.io/api/games"


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
