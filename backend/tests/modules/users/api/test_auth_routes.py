import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.modules.users.domain.entities import User

VALID_PAYLOAD = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "senha!123",
}


# ── POST /auth/signup ──────────────────────────────────────────────────────


def test_signup_returns_201_with_user_data(api_client):
    response = api_client.post("/auth/signup", json=VALID_PAYLOAD)

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["email_verified"] is False
    assert "id" in data
    assert "created_at" in data
    assert "password_hash" not in data


def test_signup_password_too_short_returns_422(api_client):
    response = api_client.post("/auth/signup", json={**VALID_PAYLOAD, "password": "abc!1"})
    assert response.status_code == 422


def test_signup_password_without_special_char_returns_422(api_client):
    response = api_client.post("/auth/signup", json={**VALID_PAYLOAD, "password": "senha12345"})
    assert response.status_code == 422


def test_signup_invalid_email_returns_422(api_client):
    response = api_client.post("/auth/signup", json={**VALID_PAYLOAD, "email": "not-an-email"})
    assert response.status_code == 422


def test_signup_username_too_short_returns_422(api_client):
    response = api_client.post("/auth/signup", json={**VALID_PAYLOAD, "username": "ab"})
    assert response.status_code == 422


def test_signup_username_with_invalid_char_returns_422(api_client):
    response = api_client.post("/auth/signup", json={**VALID_PAYLOAD, "username": "user name"})
    assert response.status_code == 422


def test_signup_duplicate_username_returns_409(api_client):
    api_client.post("/auth/signup", json=VALID_PAYLOAD)
    response = api_client.post(
        "/auth/signup", json={**VALID_PAYLOAD, "email": "other@example.com"}
    )
    assert response.status_code == 409
    assert "Username" in response.json()["detail"]


def test_signup_duplicate_email_returns_409(api_client):
    api_client.post("/auth/signup", json=VALID_PAYLOAD)
    response = api_client.post(
        "/auth/signup", json={**VALID_PAYLOAD, "username": "otheruser"}
    )
    assert response.status_code == 409
    assert "E-mail" in response.json()["detail"]


# ── POST /auth/verify-email ────────────────────────────────────────────────


def _insert_token(user_repo, token_repo, *, expired: bool = False, used: bool = False) -> str:
    user = user_repo.add(
        User(
            id=None,
            username="verifyuser",
            email="verify@test.com",
            password_hash="h",
            email_verified=False,
            created_at=None,
            updated_at=None,
        )
    )
    raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = (
        datetime.now(timezone.utc) - timedelta(hours=1)
        if expired
        else datetime.now(timezone.utc) + timedelta(hours=24)
    )
    token = token_repo.add(user.id, token_hash, expires_at)
    if used:
        token_repo.mark_used(token.id)
    return raw


def test_verify_email_returns_204(api_client, user_repo, token_repo):
    raw = _insert_token(user_repo, token_repo)
    response = api_client.post("/auth/verify-email", json={"token": raw})
    assert response.status_code == 204


def test_verify_email_invalid_token_returns_400(api_client):
    response = api_client.post("/auth/verify-email", json={"token": "invalido"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Token inválido."


def test_verify_email_expired_token_returns_400(api_client, user_repo, token_repo):
    raw = _insert_token(user_repo, token_repo, expired=True)
    response = api_client.post("/auth/verify-email", json={"token": raw})
    assert response.status_code == 400
    assert response.json()["detail"] == "Token expirado."


def test_verify_email_used_token_returns_400(api_client, user_repo, token_repo):
    raw = _insert_token(user_repo, token_repo, used=True)
    response = api_client.post("/auth/verify-email", json={"token": raw})
    assert response.status_code == 400
    assert response.json()["detail"] == "Token já utilizado."


# ── POST /auth/login ───────────────────────────────────────────────────────

import bcrypt as _bcrypt

_LOGIN_PASSWORD = "senha!123"
_LOGIN_HASH = _bcrypt.hashpw(_LOGIN_PASSWORD.encode(), _bcrypt.gensalt(rounds=4)).decode()


def _create_user(user_repo):
    from app.modules.users.domain.entities import User

    return user_repo.add(
        User(
            id=None,
            username="loginuser",
            email="login@example.com",
            password_hash=_LOGIN_HASH,
            email_verified=True,
            created_at=None,
            updated_at=None,
        )
    )


def test_login_returns_200_with_user_data(api_client, user_repo):
    _create_user(user_repo)
    response = api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": _LOGIN_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "loginuser"
    assert data["email"] == "login@example.com"
    assert "id" in data
    assert "password_hash" not in data


def test_login_sets_access_token_cookie(api_client, user_repo):
    _create_user(user_repo)
    response = api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": _LOGIN_PASSWORD}
    )
    assert "access_token" in response.cookies


def test_login_remember_me_true_sets_max_age(api_client, user_repo):
    _create_user(user_repo)
    response = api_client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": _LOGIN_PASSWORD, "remember_me": True},
    )
    set_cookie = response.headers.get("set-cookie", "")
    assert "max-age" in set_cookie.lower()


def test_login_remember_me_false_sets_session_cookie(api_client, user_repo):
    _create_user(user_repo)
    response = api_client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": _LOGIN_PASSWORD, "remember_me": False},
    )
    set_cookie = response.headers.get("set-cookie", "")
    assert "max-age" not in set_cookie.lower()


def test_login_wrong_email_returns_401_generic(api_client):
    response = api_client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": _LOGIN_PASSWORD}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha inválidos."


def test_login_wrong_password_returns_401_generic(api_client, user_repo):
    _create_user(user_repo)
    response = api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": "wrongpass!"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha inválidos."


def test_login_invalid_email_format_returns_422(api_client):
    response = api_client.post(
        "/auth/login", json={"email": "not-an-email", "password": _LOGIN_PASSWORD}
    )
    assert response.status_code == 422


def test_login_empty_password_returns_422(api_client):
    response = api_client.post("/auth/login", json={"email": "login@example.com", "password": ""})
    assert response.status_code == 422


# ── GET /auth/me ───────────────────────────────────────────────────────────


def test_me_returns_user_when_authenticated(api_client, user_repo):
    _create_user(user_repo)
    api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": _LOGIN_PASSWORD}
    )
    response = api_client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["username"] == "loginuser"


def test_me_returns_401_without_cookie(api_client):
    response = api_client.get("/auth/me")
    assert response.status_code == 401


def test_me_returns_401_with_invalid_token(api_client):
    api_client.cookies.set("access_token", "not.a.valid.jwt")
    response = api_client.get("/auth/me")
    assert response.status_code == 401
    api_client.cookies.clear()


def test_me_returns_profile_fields(api_client, user_repo):
    _create_user(user_repo)
    api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": _LOGIN_PASSWORD}
    )
    response = api_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] is None
    assert data["avatarUrl"] is None
    assert "memberSince" in data


# ── PATCH /auth/me ─────────────────────────────────────────────────────────


def _login(api_client, user_repo):
    _create_user(user_repo)
    api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": _LOGIN_PASSWORD}
    )


def test_update_me_changes_bio_returns_200(api_client, user_repo):
    _login(api_client, user_repo)
    response = api_client.patch("/auth/me", json={"bio": "Gamer desde 1998."})
    assert response.status_code == 200
    assert response.json()["bio"] == "Gamer desde 1998."


def test_update_me_persists_bio(api_client, user_repo):
    _login(api_client, user_repo)
    api_client.patch("/auth/me", json={"bio": "minha bio"})
    assert api_client.get("/auth/me").json()["bio"] == "minha bio"


def test_update_me_bio_too_long_returns_400(api_client, user_repo):
    _login(api_client, user_repo)
    response = api_client.patch("/auth/me", json={"bio": "a" * 501})
    assert response.status_code == 400


def test_update_me_returns_401_without_cookie(api_client):
    response = api_client.patch("/auth/me", json={"bio": "hello"})
    assert response.status_code == 401


# ── POST /auth/logout ──────────────────────────────────────────────────────


def test_logout_returns_204_and_clears_cookie(api_client, user_repo):
    _create_user(user_repo)
    api_client.post(
        "/auth/login", json={"email": "login@example.com", "password": _LOGIN_PASSWORD}
    )
    response = api_client.post("/auth/logout")
    assert response.status_code == 204
    # after logout the /me endpoint must reject
    assert api_client.get("/auth/me").status_code == 401
