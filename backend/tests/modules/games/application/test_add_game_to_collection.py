import pytest

from app.modules.games.application.add_game_to_collection import AddGameToCollectionUseCase
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.exceptions import GameAlreadyInCollection, GameNotFound
from tests.conftest import FakeGameDetailProvider, FakeGameRepository, FakeUserGameRepository

EXTERNAL_ID = "rawg-3328"
INTERNAL_ID = 1


def _make_use_case(
    detail_provider: FakeGameDetailProvider,
    game_repo: FakeGameRepository,
    user_game_repo: FakeUserGameRepository,
) -> AddGameToCollectionUseCase:
    details_uc = GetGameDetailsUseCase(provider=detail_provider, repository=game_repo)
    return AddGameToCollectionUseCase(details_use_case=details_uc, repository=user_game_repo)


def _setup_repos(
    detail_provider: FakeGameDetailProvider,
    game_repo: FakeGameRepository,
    user_game_repo: FakeUserGameRepository,
) -> None:
    from datetime import date
    from app.modules.games.domain.entities import GameDetail

    detail = GameDetail(
        id=EXTERNAL_ID,
        name="The Witcher 3",
        description=None,
        release_date=date(2015, 5, 19),
        cover_url=None,
        genres=[],
        platforms=["PC"],
        developers=[],
        rawg_rating=None,
        screenshots=[],
    )
    detail_provider._detail = detail
    game_repo._stored[EXTERNAL_ID] = detail
    user_game_repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID


def test_add_game_success():
    provider = FakeGameDetailProvider()
    game_repo = FakeGameRepository()
    user_game_repo = FakeUserGameRepository()
    _setup_repos(provider, game_repo, user_game_repo)

    uc = _make_use_case(provider, game_repo, user_game_repo)
    result = uc.execute(user_id=42, external_id=EXTERNAL_ID)

    assert result.user_id == 42
    assert result.game_id == INTERNAL_ID
    assert len(user_game_repo._rows) == 1


def test_add_game_calls_details_use_case():
    provider = FakeGameDetailProvider()
    game_repo = FakeGameRepository()
    user_game_repo = FakeUserGameRepository()
    # seed provider and internal_ids but NOT game_repo cache,
    # so GetGameDetailsUseCase must call the provider
    from datetime import date
    from app.modules.games.domain.entities import GameDetail
    provider._detail = GameDetail(
        id=EXTERNAL_ID, name="The Witcher 3", description=None,
        release_date=date(2015, 5, 19), cover_url=None,
        genres=[], platforms=["PC"], developers=[],
        rawg_rating=None, screenshots=[],
    )
    user_game_repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID

    uc = _make_use_case(provider, game_repo, user_game_repo)
    uc.execute(user_id=42, external_id=EXTERNAL_ID)

    assert EXTERNAL_ID in provider.calls


def test_add_game_already_in_collection_raises():
    provider = FakeGameDetailProvider()
    game_repo = FakeGameRepository()
    user_game_repo = FakeUserGameRepository()
    _setup_repos(provider, game_repo, user_game_repo)
    user_game_repo.add(user_id=42, game_id=INTERNAL_ID)

    uc = _make_use_case(provider, game_repo, user_game_repo)
    with pytest.raises(GameAlreadyInCollection):
        uc.execute(user_id=42, external_id=EXTERNAL_ID)


def test_add_game_not_found_propagates():
    from app.modules.games.domain.exceptions import GameNotFound as GNF

    provider = FakeGameDetailProvider(raise_=GNF)
    game_repo = FakeGameRepository()
    user_game_repo = FakeUserGameRepository()
    user_game_repo.internal_ids[EXTERNAL_ID] = INTERNAL_ID

    uc = _make_use_case(provider, game_repo, user_game_repo)
    with pytest.raises(GNF):
        uc.execute(user_id=42, external_id=EXTERNAL_ID)
