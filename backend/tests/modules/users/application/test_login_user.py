import bcrypt
import pytest

from app.modules.users.application.login_user import LoginUserUseCase
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import InvalidCredentials
from tests.conftest import FakeUserRepo

_PLAIN_PASSWORD = "senha!123"
_PASSWORD_HASH = bcrypt.hashpw(_PLAIN_PASSWORD.encode(), bcrypt.gensalt(rounds=4)).decode()


def _make_user(repo: FakeUserRepo, password_hash: str | None = _PASSWORD_HASH) -> User:
    return repo.add(
        User(
            id=None,
            username="testuser",
            email="test@example.com",
            password_hash=password_hash,
            email_verified=False,
            created_at=None,
            updated_at=None,
        )
    )


def test_valid_credentials_return_user():
    repo = FakeUserRepo()
    _make_user(repo)
    use_case = LoginUserUseCase(user_repo=repo)

    user = use_case.execute(email="test@example.com", password=_PLAIN_PASSWORD)

    assert user.email == "test@example.com"
    assert user.username == "testuser"


def test_unknown_email_raises_invalid_credentials():
    repo = FakeUserRepo()
    use_case = LoginUserUseCase(user_repo=repo)

    with pytest.raises(InvalidCredentials):
        use_case.execute(email="unknown@example.com", password=_PLAIN_PASSWORD)


def test_wrong_password_raises_invalid_credentials():
    repo = FakeUserRepo()
    _make_user(repo)
    use_case = LoginUserUseCase(user_repo=repo)

    with pytest.raises(InvalidCredentials):
        use_case.execute(email="test@example.com", password="wrong-password!")


def test_oauth_only_account_raises_invalid_credentials():
    repo = FakeUserRepo()
    _make_user(repo, password_hash=None)
    use_case = LoginUserUseCase(user_repo=repo)

    with pytest.raises(InvalidCredentials):
        use_case.execute(email="test@example.com", password=_PLAIN_PASSWORD)
