from app.modules.games.application.get_collection_stats import GetCollectionStatsUseCase
from app.modules.games.domain.entities import UserGameStatus
from tests.conftest import FakeUserGameRepository


def test_status_counts():
    repo = FakeUserGameRepository()
    repo.add(user_id=1, game_id=1, status=UserGameStatus.want_to_play)
    repo.add(user_id=1, game_id=2, status=UserGameStatus.playing)
    repo.add(user_id=1, game_id=3, status=UserGameStatus.finished)
    repo.add(user_id=1, game_id=4, status=UserGameStatus.finished)

    stats = GetCollectionStatsUseCase(repository=repo).execute(1)

    assert stats.status_counts[UserGameStatus.want_to_play] == 1
    assert stats.status_counts[UserGameStatus.playing] == 1
    assert stats.status_counts[UserGameStatus.finished] == 2


def test_games_rated_and_average():
    repo = FakeUserGameRepository()
    repo.add(user_id=1, game_id=1)
    repo.add(user_id=1, game_id=2)
    repo.add(user_id=1, game_id=3)
    repo.set_rating(user_id=1, game_id=1, rating=4.0)
    repo.set_rating(user_id=1, game_id=2, rating=5.0)

    stats = GetCollectionStatsUseCase(repository=repo).execute(1)

    assert stats.games_rated == 2
    assert stats.average_rating == 4.5


def test_average_is_none_without_ratings():
    repo = FakeUserGameRepository()
    repo.add(user_id=1, game_id=1)

    stats = GetCollectionStatsUseCase(repository=repo).execute(1)

    assert stats.games_rated == 0
    assert stats.average_rating is None


def test_recent_games_limited_to_six_preserving_repo_order():
    repo = FakeUserGameRepository()
    for game_id in range(1, 8):  # 7 games
        repo.add(user_id=1, game_id=game_id)

    stats = GetCollectionStatsUseCase(repository=repo).execute(1)

    assert len(stats.recent_games) == 6
    expected = repo.list_by_user(1)[:6]
    assert [g.game_id for g in stats.recent_games] == [g.game_id for g in expected]


def test_only_counts_current_user():
    repo = FakeUserGameRepository()
    repo.add(user_id=1, game_id=1, status=UserGameStatus.playing)
    repo.add(user_id=2, game_id=2, status=UserGameStatus.playing)

    stats = GetCollectionStatsUseCase(repository=repo).execute(1)

    assert stats.status_counts[UserGameStatus.playing] == 1
    assert len(stats.recent_games) == 1


def test_empty_collection():
    repo = FakeUserGameRepository()

    stats = GetCollectionStatsUseCase(repository=repo).execute(1)

    assert stats.games_rated == 0
    assert stats.average_rating is None
    assert stats.status_counts == {s: 0 for s in UserGameStatus}
    assert stats.recent_games == []
