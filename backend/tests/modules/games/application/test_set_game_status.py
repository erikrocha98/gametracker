import pytest

from app.modules.games.application.set_game_status import SetGameStatusUseCase
from app.modules.games.domain.entities import UserGameStatus
from app.modules.games.domain.exceptions import GameNotInCollection


def _make_use_case(fake_user_game_repo) -> SetGameStatusUseCase:
    return SetGameStatusUseCase(repository=fake_user_game_repo)


def test_set_status_changes_status(fake_user_game_repo):
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    fake_user_game_repo.add(user_id=1, game_id=10)

    result = _make_use_case(fake_user_game_repo).execute(
        user_id=1, external_id="rawg-1", status=UserGameStatus.finished
    )

    assert result.status == UserGameStatus.finished


def test_set_status_to_playing(fake_user_game_repo):
    fake_user_game_repo.internal_ids["rawg-1"] = 10
    fake_user_game_repo.add(user_id=1, game_id=10)

    result = _make_use_case(fake_user_game_repo).execute(
        user_id=1, external_id="rawg-1", status=UserGameStatus.playing
    )

    assert result.status == UserGameStatus.playing
    assert fake_user_game_repo.get(user_id=1, game_id=10).status == UserGameStatus.playing


def test_set_status_not_in_collection_raises(fake_user_game_repo):
    fake_user_game_repo.internal_ids["rawg-1"] = 10

    with pytest.raises(GameNotInCollection):
        _make_use_case(fake_user_game_repo).execute(
            user_id=1, external_id="rawg-1", status=UserGameStatus.playing
        )


def test_set_status_unknown_game_raises(fake_user_game_repo):
    with pytest.raises(GameNotInCollection):
        _make_use_case(fake_user_game_repo).execute(
            user_id=1, external_id="rawg-999", status=UserGameStatus.finished
        )
