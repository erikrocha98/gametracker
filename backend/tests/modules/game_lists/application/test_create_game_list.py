from app.modules.game_lists.application.create_game_list import CreateGameListUseCase
from tests.conftest import FakeGameListRepository


def test_create_returns_list_scoped_to_user():
    repo = FakeGameListRepository()
    uc = CreateGameListUseCase(repository=repo)

    result = uc.execute(user_id=42, name="RPGs", description="favoritos")

    assert result.user_id == 42
    assert result.name == "RPGs"
    assert result.description == "favoritos"
    assert len(repo.list_by_user(42)) == 1


def test_create_defaults_to_private():
    repo = FakeGameListRepository()
    uc = CreateGameListUseCase(repository=repo)

    result = uc.execute(user_id=42, name="RPGs")

    assert result.is_public is False
