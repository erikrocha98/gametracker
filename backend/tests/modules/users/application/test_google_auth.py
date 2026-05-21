import pytest

from app.modules.users.application.google_auth import GoogleAuthUseCase
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import InvalidGoogleToken
from app.modules.users.domain.google_identity import GoogleIdentity
from tests.conftest import FakeUserRepo


def _make_identity(
    sub: str = "google-sub-123",
    email: str = "user@example.com",
    email_verified: bool = True,
    name: str = "User Name",
) -> GoogleIdentity:
    return GoogleIdentity(sub=sub, email=email, email_verified=email_verified, name=name)


class FakeTokenVerifier:
    def __init__(self, identity: GoogleIdentity | None = None, raises: bool = False) -> None:
        self._identity = identity or _make_identity()
        self._raises = raises

    def verify(self, id_token: str) -> GoogleIdentity:
        if self._raises:
            raise InvalidGoogleToken
        return self._identity


def _make_use_case(repo: FakeUserRepo, identity: GoogleIdentity | None = None, raises: bool = False) -> GoogleAuthUseCase:
    return GoogleAuthUseCase(
        user_repo=repo,
        token_verifier=FakeTokenVerifier(identity=identity, raises=raises),
    )


# ── invalid token ────────────────────────────────────────────────────────────

def test_invalid_token_raises():
    repo = FakeUserRepo()
    use_case = _make_use_case(repo, raises=True)

    with pytest.raises(InvalidGoogleToken):
        use_case.execute("bad-token")


def test_unverified_email_raises():
    repo = FakeUserRepo()
    identity = _make_identity(email_verified=False)
    use_case = _make_use_case(repo, identity=identity)

    with pytest.raises(InvalidGoogleToken):
        use_case.execute("token")


# ── returning google user ─────────────────────────────────────────────────────

def test_returning_google_user_logs_in():
    repo = FakeUserRepo()
    existing = repo.add(User(
        id=None, username="userexample", email="user@example.com",
        password_hash=None, email_verified=True,
        created_at=None, updated_at=None, google_id="google-sub-123",
    ))
    use_case = _make_use_case(repo)

    result = use_case.execute("token")

    assert result.id == existing.id
    assert result.google_id == "google-sub-123"


# ── account linking ───────────────────────────────────────────────────────────

def test_existing_email_account_gets_linked():
    repo = FakeUserRepo()
    existing = repo.add(User(
        id=None, username="userexample", email="user@example.com",
        password_hash="hash", email_verified=True,
        created_at=None, updated_at=None,
    ))
    assert existing.google_id is None

    use_case = _make_use_case(repo)
    result = use_case.execute("token")

    assert result.id == existing.id
    assert result.google_id == "google-sub-123"


# ── auto account creation ─────────────────────────────────────────────────────

def test_new_user_is_created():
    repo = FakeUserRepo()
    use_case = _make_use_case(repo)

    result = use_case.execute("token")

    assert result.email == "user@example.com"
    assert result.password_hash is None
    assert result.email_verified is True
    assert result.google_id == "google-sub-123"


def test_new_user_username_derived_from_email():
    repo = FakeUserRepo()
    identity = _make_identity(email="erik.rocha@gmail.com")
    use_case = _make_use_case(repo, identity=identity)

    result = use_case.execute("token")

    assert result.username == "erikrocha"


def test_username_collision_appends_suffix():
    repo = FakeUserRepo()
    repo.add(User(
        id=None, username="erikrocha", email="other@example.com",
        password_hash="hash", email_verified=True,
        created_at=None, updated_at=None,
    ))
    identity = _make_identity(email="erik.rocha@gmail.com")
    use_case = _make_use_case(repo, identity=identity)

    result = use_case.execute("token")

    assert result.username == "erikrocha1"


def test_multiple_collisions_resolved():
    repo = FakeUserRepo()
    for suffix in ("", "1", "2"):
        repo.add(User(
            id=None, username=f"erikrocha{suffix}", email=f"other{suffix}@example.com",
            password_hash="hash", email_verified=True,
            created_at=None, updated_at=None,
        ))
    identity = _make_identity(email="erik.rocha@gmail.com")
    use_case = _make_use_case(repo, identity=identity)

    result = use_case.execute("token")

    assert result.username == "erikrocha3"
