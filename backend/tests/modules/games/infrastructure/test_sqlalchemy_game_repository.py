from datetime import date

import pytest

from app.modules.games.domain.entities import GameDetail
from app.modules.games.infrastructure.external_id import parse_external_id as _parse_external_id
from app.modules.games.infrastructure.sqlalchemy_repository import (
    GameModel,
    SqlAlchemyGameRepository,
)


# ── _parse_external_id ─────────────────────────────────────────────────────


def test_parse_external_id_valid():
    assert _parse_external_id("rawg-3498") == ("rawg", "3498")


def test_parse_external_id_with_multiple_hyphens():
    # split on first hyphen only — the rest stays in external_id
    assert _parse_external_id("rawg-some-slug-123") == ("rawg", "some-slug-123")


def test_parse_external_id_no_prefix_raises():
    with pytest.raises(ValueError):
        _parse_external_id("3498")


def test_parse_external_id_empty_raises():
    with pytest.raises(ValueError):
        _parse_external_id("")


# ── find_by_id ─────────────────────────────────────────────────────────────


def test_find_by_id_returns_none_when_query_returns_nothing(mocker):
    session = mocker.MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = None

    repo = SqlAlchemyGameRepository(session)
    assert repo.find_by_id("rawg-3498") is None


def test_find_by_id_maps_row_to_entity(mocker):
    row = GameModel(
        external_source="rawg",
        external_id="3498",
        name="The Witcher 3",
        description="Open world RPG",
        release_date=date(2015, 5, 19),
        cover_url="https://example.com/cover.jpg",
        genres=["RPG"],
        platforms=["PC"],
        developers=["CD Projekt Red"],
        rawg_rating=4.6,
        screenshots=["https://example.com/s1.jpg"],
    )
    session = mocker.MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = row

    repo = SqlAlchemyGameRepository(session)
    result = repo.find_by_id("rawg-3498")

    assert result.id == "rawg-3498"
    assert result.name == "The Witcher 3"
    assert result.description == "Open world RPG"
    assert result.release_date == date(2015, 5, 19)
    assert result.rawg_rating == 4.6
    assert result.screenshots == ["https://example.com/s1.jpg"]


# ── save (insert path) ─────────────────────────────────────────────────────


def test_save_adds_new_row_when_not_existing(mocker):
    session = mocker.MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = None

    repo = SqlAlchemyGameRepository(session)
    detail = GameDetail(
        id="rawg-3498",
        name="The Witcher 3",
        description=None,
        release_date=None,
        cover_url=None,
        genres=[],
        platforms=[],
        developers=[],
        rawg_rating=None,
        screenshots=[],
    )
    repo.save(detail)

    session.add.assert_called_once()
    added: GameModel = session.add.call_args[0][0]
    assert added.external_source == "rawg"
    assert added.external_id == "3498"
    assert added.name == "The Witcher 3"
    session.flush.assert_called_once()


# ── save (update path) ─────────────────────────────────────────────────────


def test_save_updates_existing_row_without_adding(mocker):
    existing = GameModel(
        external_source="rawg",
        external_id="3498",
        name="Old Name",
        description=None,
        release_date=None,
        cover_url=None,
        genres=[],
        platforms=[],
        developers=[],
        rawg_rating=None,
        screenshots=[],
    )
    session = mocker.MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = existing

    repo = SqlAlchemyGameRepository(session)
    detail = GameDetail(
        id="rawg-3498",
        name="Updated Name",
        description="desc",
        release_date=date(2015, 5, 19),
        cover_url="https://cover.jpg",
        genres=["RPG"],
        platforms=["PC"],
        developers=["CD Projekt Red"],
        rawg_rating=4.7,
        screenshots=["https://s1.jpg"],
    )
    repo.save(detail)

    session.add.assert_not_called()
    assert existing.name == "Updated Name"
    assert existing.rawg_rating == 4.7
    session.flush.assert_called_once()
