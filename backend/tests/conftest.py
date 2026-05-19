from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.users.api.dependencies import get_signup_use_case, get_verify_email_use_case
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.entities import EmailVerificationToken, User


# ── Fakes ──────────────────────────────────────────────────────────────────


class FakeUserRepo:
    def __init__(self) -> None:
        self._users: list[User] = []
        self._next_id = 1

    def get_by_username(self, username: str) -> User | None:
        return next((u for u in self._users if u.username == username), None)

    def get_by_email(self, email: str) -> User | None:
        return next((u for u in self._users if u.email == email), None)

    def get_by_id(self, user_id: int) -> User | None:
        return next((u for u in self._users if u.id == user_id), None)

    def add(self, user: User) -> User:
        user.id = self._next_id
        self._next_id += 1
        user.created_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        self._users.append(user)
        return user

    def mark_email_verified(self, user_id: int) -> None:
        for u in self._users:
            if u.id == user_id:
                u.email_verified = True


class FakeTokenRepo:
    def __init__(self) -> None:
        self._tokens: list[EmailVerificationToken] = []
        self._next_id = 1

    def add(self, user_id: int, token_hash: str, expires_at: datetime) -> EmailVerificationToken:
        token = EmailVerificationToken(
            id=self._next_id,
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            used_at=None,
            created_at=datetime.now(timezone.utc),
        )
        self._next_id += 1
        self._tokens.append(token)
        return token

    def get_by_hash(self, token_hash: str) -> EmailVerificationToken | None:
        return next((t for t in self._tokens if t.token_hash == token_hash), None)

    def mark_used(self, token_id: int) -> None:
        for t in self._tokens:
            if t.id == token_id:
                t.used_at = datetime.now(timezone.utc)


class FakeEmailSender:
    def __init__(self) -> None:
        self.sent: list[dict[str, str]] = []

    def send_verification(self, *, to: str, link: str) -> None:
        self.sent.append({"to": to, "link": link})


# ── Fixtures ───────────────────────────────────────────────────────────────


@pytest.fixture
def user_repo() -> FakeUserRepo:
    return FakeUserRepo()


@pytest.fixture
def token_repo() -> FakeTokenRepo:
    return FakeTokenRepo()


@pytest.fixture
def email_sender() -> FakeEmailSender:
    return FakeEmailSender()


@pytest.fixture
def api_client(user_repo: FakeUserRepo, token_repo: FakeTokenRepo, email_sender: FakeEmailSender):
    def _signup_use_case() -> SignUpUserUseCase:
        return SignUpUserUseCase(
            user_repo=user_repo,
            token_repo=token_repo,
            email_sender=email_sender,
            frontend_base_url="http://localhost:5173",
            token_ttl_hours=24,
        )

    def _verify_use_case() -> VerifyEmailUseCase:
        return VerifyEmailUseCase(
            user_repo=user_repo,
            token_repo=token_repo,
        )

    app.dependency_overrides[get_signup_use_case] = _signup_use_case
    app.dependency_overrides[get_verify_email_use_case] = _verify_use_case
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
