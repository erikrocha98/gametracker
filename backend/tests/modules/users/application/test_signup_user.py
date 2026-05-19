import pytest

from app.core.security import verify_password
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.domain.exceptions import EmailAlreadyTaken, UsernameAlreadyTaken

VALID_USERNAME = "testuser"
VALID_EMAIL = "user@test.com"
VALID_PASSWORD = "senha!123"


def _make_use_case(user_repo, token_repo, email_sender) -> SignUpUserUseCase:
    return SignUpUserUseCase(
        user_repo=user_repo,
        token_repo=token_repo,
        email_sender=email_sender,
        frontend_base_url="http://localhost:5173",
        token_ttl_hours=24,
    )


def test_signup_creates_user(user_repo, token_repo, email_sender):
    uc = _make_use_case(user_repo, token_repo, email_sender)
    user = uc.execute(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD)

    assert user.id is not None
    assert user.username == VALID_USERNAME
    assert user.email == VALID_EMAIL
    assert user.email_verified is False
    assert len(user_repo._users) == 1


def test_signup_hashes_password(user_repo, token_repo, email_sender):
    uc = _make_use_case(user_repo, token_repo, email_sender)
    user = uc.execute(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD)

    assert user.password_hash != VALID_PASSWORD
    assert verify_password(VALID_PASSWORD, user.password_hash)


def test_signup_generates_token_and_sends_email(user_repo, token_repo, email_sender):
    uc = _make_use_case(user_repo, token_repo, email_sender)
    uc.execute(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD)

    assert len(token_repo._tokens) == 1
    assert len(email_sender.sent) == 1
    assert email_sender.sent[0]["to"] == VALID_EMAIL
    assert "verify-email" in email_sender.sent[0]["link"]


def test_signup_normalizes_username_to_lowercase(user_repo, token_repo, email_sender):
    uc = _make_use_case(user_repo, token_repo, email_sender)
    user = uc.execute("TestUser", VALID_EMAIL, VALID_PASSWORD)

    assert user.username == "testuser"


def test_signup_raises_if_username_taken(user_repo, token_repo, email_sender):
    uc = _make_use_case(user_repo, token_repo, email_sender)
    uc.execute(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD)

    with pytest.raises(UsernameAlreadyTaken):
        uc.execute(VALID_USERNAME, "other@test.com", VALID_PASSWORD)


def test_signup_raises_if_email_taken(user_repo, token_repo, email_sender):
    uc = _make_use_case(user_repo, token_repo, email_sender)
    uc.execute(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD)

    with pytest.raises(EmailAlreadyTaken):
        uc.execute("otheruser", VALID_EMAIL, VALID_PASSWORD)
