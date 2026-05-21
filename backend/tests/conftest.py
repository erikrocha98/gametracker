from datetime import datetime, timezone

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.core.security import decode_access_token
from app.main import app
from app.modules.users.api.dependencies import (
    get_current_user,
    get_login_use_case,
    get_signup_use_case,
    get_verify_email_use_case,
)
from app.modules.users.application.login_user import LoginUserUseCase
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.entities import EmailVerificationToken, User

import jwt as pyjwt

_TEST_JWT_SECRET = "test-jwt-secret-do-not-use-in-prod"

_TEST_SETTINGS = Settings(
    database_url="postgresql://test:test@localhost/test",
    jwt_secret=_TEST_JWT_SECRET,
    cookie_secure=False,
    google_client_id="test-google-client-id",
)


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

    def get_by_google_id(self, google_id: str) -> User | None:
        return next((u for u in self._users if u.google_id == google_id), None)

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

    def link_google_account(self, user_id: int, google_id: str) -> None:
        for u in self._users:
            if u.id == user_id:
                u.google_id = google_id


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

    def _login_use_case() -> LoginUserUseCase:
        return LoginUserUseCase(user_repo=user_repo)

    def _get_settings() -> Settings:
        return _TEST_SETTINGS

    def _get_current_user(request: Request) -> User:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Não autenticado.")
        try:
            user_id = decode_access_token(token, _TEST_JWT_SECRET)
        except pyjwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Não autenticado.")
        user = user_repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="Não autenticado.")
        return user

    app.dependency_overrides[get_signup_use_case] = _signup_use_case
    app.dependency_overrides[get_verify_email_use_case] = _verify_use_case
    app.dependency_overrides[get_login_use_case] = _login_use_case
    app.dependency_overrides[get_settings] = _get_settings
    app.dependency_overrides[get_current_user] = _get_current_user

    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
