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
