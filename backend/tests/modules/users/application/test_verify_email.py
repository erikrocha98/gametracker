import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import pytest

from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import (
    ExpiredVerificationToken,
    InvalidVerificationToken,
    UsedVerificationToken,
)


def _add_user(user_repo) -> User:
    return user_repo.add(
        User(
            id=None,
            username="erik",
            email="erik@test.com",
            password_hash="hash",
            email_verified=False,
            created_at=None,
            updated_at=None,
        )
    )


def _add_token(token_repo, user_id: int, *, expired: bool = False, used: bool = False) -> str:
    raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = (
        datetime.now(timezone.utc) - timedelta(hours=1)
        if expired
        else datetime.now(timezone.utc) + timedelta(hours=24)
    )
    token = token_repo.add(user_id, token_hash, expires_at)
    if used:
        token_repo.mark_used(token.id)
    return raw


def test_verify_email_marks_user_verified(user_repo, token_repo):
    user = _add_user(user_repo)
    raw = _add_token(token_repo, user.id)

    VerifyEmailUseCase(user_repo=user_repo, token_repo=token_repo).execute(raw)

    assert user_repo.get_by_id(user.id).email_verified is True


def test_verify_email_marks_token_used(user_repo, token_repo):
    user = _add_user(user_repo)
    raw = _add_token(token_repo, user.id)

    VerifyEmailUseCase(user_repo=user_repo, token_repo=token_repo).execute(raw)

    assert token_repo._tokens[0].used_at is not None


def test_verify_email_invalid_token_raises(user_repo, token_repo):
    with pytest.raises(InvalidVerificationToken):
        VerifyEmailUseCase(user_repo=user_repo, token_repo=token_repo).execute("invalido")


def test_verify_email_expired_token_raises(user_repo, token_repo):
    user = _add_user(user_repo)
    raw = _add_token(token_repo, user.id, expired=True)

    with pytest.raises(ExpiredVerificationToken):
        VerifyEmailUseCase(user_repo=user_repo, token_repo=token_repo).execute(raw)


def test_verify_email_used_token_raises(user_repo, token_repo):
    user = _add_user(user_repo)
    raw = _add_token(token_repo, user.id, used=True)

    with pytest.raises(UsedVerificationToken):
        VerifyEmailUseCase(user_repo=user_repo, token_repo=token_repo).execute(raw)
