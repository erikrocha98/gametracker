from datetime import date

import pytest

from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.entities import GameDetail
from app.modules.games.domain.exceptions import GameNotFound

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


class FakeProvider:
    def __init__(self, detail: GameDetail | None = None, *, raise_not_found: bool = False) -> None:
        self._detail = detail
        self._raise = raise_not_found
        self.calls: list[str] = []

    def get_by_id(self, game_id: str) -> GameDetail:
        self.calls.append(game_id)
        if self._raise:
            raise GameNotFound
        return self._detail


class FakeRepository:
    def __init__(self, stored: GameDetail | None = None) -> None:
        self._stored: dict[str, GameDetail] = {stored.id: stored} if stored else {}
        self.saved: list[GameDetail] = []

    def find_by_id(self, game_id: str) -> GameDetail | None:
        return self._stored.get(game_id)

    def save(self, detail: GameDetail) -> None:
        self._stored[detail.id] = detail
        self.saved.append(detail)


def test_cache_miss_calls_provider_and_saves():
    provider = FakeProvider(detail=_DETAIL)
    repo = FakeRepository()
    use_case = GetGameDetailsUseCase(provider=provider, repository=repo)

    result = use_case.execute("rawg-3498")

    assert result == _DETAIL
    assert provider.calls == ["rawg-3498"]
    assert len(repo.saved) == 1
    assert repo.saved[0] == _DETAIL


def test_cache_hit_does_not_call_provider():
    provider = FakeProvider(detail=_DETAIL)
    repo = FakeRepository(stored=_DETAIL)
    use_case = GetGameDetailsUseCase(provider=provider, repository=repo)

    result = use_case.execute("rawg-3498")

    assert result == _DETAIL
    assert provider.calls == []
    assert repo.saved == []


def test_provider_game_not_found_propagates():
    provider = FakeProvider(raise_not_found=True)
    repo = FakeRepository()
    use_case = GetGameDetailsUseCase(provider=provider, repository=repo)

    with pytest.raises(GameNotFound):
        use_case.execute("rawg-999")

    assert repo.saved == []
