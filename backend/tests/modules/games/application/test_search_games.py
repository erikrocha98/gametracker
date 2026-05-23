import pytest

from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.domain.entities import GameSearchResult


class FakeProvider:
    def __init__(self, results: list[GameSearchResult]) -> None:
        self._results = results
        self.calls: list[str] = []

    def search(self, query: str) -> list[GameSearchResult]:
        self.calls.append(query)
        return self._results


_RESULT = GameSearchResult(
    id="rawg-1",
    name="Zelda",
    cover_url="https://example.com/cover.jpg",
    platforms=["Nintendo Switch"],
    release_year=2017,
)


def test_empty_query_returns_empty_without_calling_provider():
    provider = FakeProvider([_RESULT])
    use_case = SearchGamesUseCase(provider=provider)
    assert use_case.execute("") == []
    assert provider.calls == []


def test_blank_query_returns_empty_without_calling_provider():
    provider = FakeProvider([_RESULT])
    use_case = SearchGamesUseCase(provider=provider)
    assert use_case.execute("   ") == []
    assert provider.calls == []


def test_single_char_query_returns_empty_without_calling_provider():
    provider = FakeProvider([_RESULT])
    use_case = SearchGamesUseCase(provider=provider)
    assert use_case.execute("z") == []
    assert provider.calls == []


def test_valid_query_delegates_to_provider():
    provider = FakeProvider([_RESULT])
    use_case = SearchGamesUseCase(provider=provider)
    results = use_case.execute("zelda")
    assert results == [_RESULT]
    assert provider.calls == ["zelda"]


def test_query_is_stripped_before_length_check():
    provider = FakeProvider([_RESULT])
    use_case = SearchGamesUseCase(provider=provider)
    assert use_case.execute(" z ") == []
    assert provider.calls == []


def test_query_is_stripped_before_delegating():
    provider = FakeProvider([_RESULT])
    use_case = SearchGamesUseCase(provider=provider)
    use_case.execute("  zelda  ")
    assert provider.calls == ["zelda"]
