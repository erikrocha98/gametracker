from datetime import datetime, timezone

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.core.security import decode_access_token
from app.main import app
from app.modules.games.api.dependencies import (
    get_add_game_to_collection_use_case,
    get_game_detail_provider,
    get_game_details_use_case,
    get_game_repository,
    get_game_search_provider,
    get_rate_game_use_case,
    get_remove_game_from_collection_use_case,
    get_remove_rating_use_case,
    get_search_games_use_case,
    get_set_game_status_use_case,
    get_user_collection_use_case,
    get_user_game_rating_use_case,
    get_user_game_repository,
)
from app.modules.games.application.add_game_to_collection import AddGameToCollectionUseCase
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.application.get_user_collection import GetUserCollectionUseCase
from app.modules.games.application.get_user_game_rating import GetUserGameRatingUseCase
from app.modules.games.application.rate_game import RateGameUseCase
from app.modules.games.application.remove_game_from_collection import RemoveGameFromCollectionUseCase
from app.modules.games.application.remove_rating import RemoveRatingUseCase
from app.modules.games.application.search_games import SearchGamesUseCase
from app.modules.games.application.set_game_status import SetGameStatusUseCase
from app.modules.games.domain.entities import GameDetail, GameSearchResult, UserGame, UserGameStatus
from app.modules.games.domain.exceptions import GameProviderUnavailable
from app.modules.users.api.dependencies import (
    get_current_user,
    get_login_use_case,
    get_signup_use_case,
    get_update_bio_use_case,
    get_verify_email_use_case,
)
from app.modules.users.application.login_user import LoginUserUseCase
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.update_bio import UpdateBioUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.entities import EmailVerificationToken, User

import jwt as pyjwt

_TEST_JWT_SECRET = "test-jwt-secret-do-not-use-in-prod"

_TEST_SETTINGS = Settings(
    database_url="postgresql://test:test@localhost/test",
    jwt_secret=_TEST_JWT_SECRET,
    cookie_secure=False,
    google_client_id="test-google-client-id",
    rawg_api_key="test-rawg-key",
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

    def update_bio(self, user_id: int, bio: str | None) -> User:
        for u in self._users:
            if u.id == user_id:
                u.bio = bio
                return u
        raise ValueError("user not found")


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


class FakeGameSearchProvider:
    def __init__(self, results: list[GameSearchResult] | None = None, *, raise_unavailable: bool = False) -> None:
        self._results = results or []
        self._raise = raise_unavailable

    def search(self, query: str) -> list[GameSearchResult]:
        if self._raise:
            raise GameProviderUnavailable
        return self._results


class FakeGameDetailProvider:
    def __init__(self, detail: GameDetail | None = None, *, raise_: type[Exception] | None = None) -> None:
        self._detail = detail
        self._raise = raise_
        self.calls: list[str] = []

    def get_by_id(self, game_id: str) -> GameDetail:
        self.calls.append(game_id)
        if self._raise is not None:
            raise self._raise
        return self._detail


class FakeGameRepository:
    def __init__(self) -> None:
        self._stored: dict[str, GameDetail] = {}
        self.saved: list[GameDetail] = []

    def find_by_id(self, game_id: str) -> GameDetail | None:
        return self._stored.get(game_id)

    def save(self, detail: GameDetail) -> None:
        self._stored[detail.id] = detail
        self.saved.append(detail)


class FakeUserGameRepository:
    def __init__(self) -> None:
        self._rows: list[UserGame] = []
        self._next_id = 1
        self.internal_ids: dict[str, int] = {}

    def find_internal_game_id(self, external_id: str) -> int | None:
        return self.internal_ids.get(external_id)

    def exists(self, *, user_id: int, game_id: int) -> bool:
        return any(r.user_id == user_id and r.game_id == game_id for r in self._rows)

    def get(self, *, user_id: int, game_id: int) -> UserGame | None:
        return next(
            (r for r in self._rows if r.user_id == user_id and r.game_id == game_id),
            None,
        )

    def add(self, *, user_id: int, game_id: int, status: UserGameStatus = UserGameStatus.want_to_play) -> UserGame:
        row = UserGame(
            id=self._next_id,
            user_id=user_id,
            game_id=game_id,
            external_id=next(
                (k for k, v in self.internal_ids.items() if v == game_id), ""
            ),
            name="",
            cover_url=None,
            platforms=[],
            release_year=None,
            added_at=datetime.now(timezone.utc),
            status=status,
        )
        self._next_id += 1
        self._rows.append(row)
        return row

    def remove(self, *, user_id: int, game_id: int) -> bool:
        before = len(self._rows)
        self._rows = [r for r in self._rows if not (r.user_id == user_id and r.game_id == game_id)]
        return len(self._rows) < before

    def set_rating(self, *, user_id: int, game_id: int, rating: float) -> UserGame:
        row = self.get(user_id=user_id, game_id=game_id)
        row.rating = rating
        row.status = UserGameStatus.finished
        return row

    def clear_rating(self, *, user_id: int, game_id: int) -> bool:
        row = self.get(user_id=user_id, game_id=game_id)
        if row is None:
            return False
        row.rating = None
        return True

    def set_status(self, *, user_id: int, game_id: int, status: UserGameStatus) -> UserGame:
        row = self.get(user_id=user_id, game_id=game_id)
        row.status = status
        return row

    def list_by_user(self, user_id: int, status: UserGameStatus | None = None) -> list[UserGame]:
        rows = [r for r in self._rows if r.user_id == user_id]
        if status is not None:
            rows = [r for r in rows if r.status == status]
        return rows


class FakeEmailSender:
    def __init__(self) -> None:
        self.sent: list[dict[str, str]] = []

    def send_verification(self, *, to: str, link: str) -> None:
        self.sent.append({"to": to, "link": link})


# ── Fixtures ───────────────────────────────────────────────────────────────


@pytest.fixture
def fake_game_provider() -> FakeGameSearchProvider:
    return FakeGameSearchProvider()


@pytest.fixture
def fake_game_detail_provider() -> FakeGameDetailProvider:
    return FakeGameDetailProvider()


@pytest.fixture
def fake_game_repo() -> FakeGameRepository:
    return FakeGameRepository()


@pytest.fixture
def fake_user_game_repo() -> FakeUserGameRepository:
    return FakeUserGameRepository()


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
def api_client(
    user_repo: FakeUserRepo,
    token_repo: FakeTokenRepo,
    email_sender: FakeEmailSender,
    fake_game_provider: FakeGameSearchProvider,
    fake_game_detail_provider: FakeGameDetailProvider,
    fake_game_repo: FakeGameRepository,
    fake_user_game_repo: FakeUserGameRepository,
):
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

    def _update_bio_use_case() -> UpdateBioUseCase:
        return UpdateBioUseCase(user_repo=user_repo)

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

    def _get_game_search_provider() -> FakeGameSearchProvider:
        return fake_game_provider

    def _get_search_games_use_case() -> SearchGamesUseCase:
        return SearchGamesUseCase(provider=fake_game_provider)

    def _get_game_detail_provider() -> FakeGameDetailProvider:
        return fake_game_detail_provider

    def _get_game_repository() -> FakeGameRepository:
        return fake_game_repo

    def _get_game_details_use_case() -> GetGameDetailsUseCase:
        return GetGameDetailsUseCase(provider=fake_game_detail_provider, repository=fake_game_repo)

    def _get_user_game_repository() -> FakeUserGameRepository:
        return fake_user_game_repo

    def _get_add_game_to_collection_use_case() -> AddGameToCollectionUseCase:
        return AddGameToCollectionUseCase(
            details_use_case=GetGameDetailsUseCase(
                provider=fake_game_detail_provider, repository=fake_game_repo
            ),
            repository=fake_user_game_repo,
        )

    def _get_remove_game_from_collection_use_case() -> RemoveGameFromCollectionUseCase:
        return RemoveGameFromCollectionUseCase(repository=fake_user_game_repo)

    def _get_user_collection_use_case() -> GetUserCollectionUseCase:
        return GetUserCollectionUseCase(repository=fake_user_game_repo)

    def _get_rate_game_use_case() -> RateGameUseCase:
        return RateGameUseCase(
            details_use_case=GetGameDetailsUseCase(
                provider=fake_game_detail_provider, repository=fake_game_repo
            ),
            repository=fake_user_game_repo,
        )

    def _get_remove_rating_use_case() -> RemoveRatingUseCase:
        return RemoveRatingUseCase(repository=fake_user_game_repo)

    def _get_user_game_rating_use_case() -> GetUserGameRatingUseCase:
        return GetUserGameRatingUseCase(repository=fake_user_game_repo)

    def _get_set_game_status_use_case() -> SetGameStatusUseCase:
        return SetGameStatusUseCase(repository=fake_user_game_repo)

    app.dependency_overrides[get_signup_use_case] = _signup_use_case
    app.dependency_overrides[get_verify_email_use_case] = _verify_use_case
    app.dependency_overrides[get_login_use_case] = _login_use_case
    app.dependency_overrides[get_update_bio_use_case] = _update_bio_use_case
    app.dependency_overrides[get_settings] = _get_settings
    app.dependency_overrides[get_current_user] = _get_current_user
    app.dependency_overrides[get_game_search_provider] = _get_game_search_provider
    app.dependency_overrides[get_search_games_use_case] = _get_search_games_use_case
    app.dependency_overrides[get_game_detail_provider] = _get_game_detail_provider
    app.dependency_overrides[get_game_repository] = _get_game_repository
    app.dependency_overrides[get_game_details_use_case] = _get_game_details_use_case
    app.dependency_overrides[get_user_game_repository] = _get_user_game_repository
    app.dependency_overrides[get_add_game_to_collection_use_case] = _get_add_game_to_collection_use_case
    app.dependency_overrides[get_remove_game_from_collection_use_case] = _get_remove_game_from_collection_use_case
    app.dependency_overrides[get_user_collection_use_case] = _get_user_collection_use_case
    app.dependency_overrides[get_rate_game_use_case] = _get_rate_game_use_case
    app.dependency_overrides[get_remove_rating_use_case] = _get_remove_rating_use_case
    app.dependency_overrides[get_user_game_rating_use_case] = _get_user_game_rating_use_case
    app.dependency_overrides[get_set_game_status_use_case] = _get_set_game_status_use_case

    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
