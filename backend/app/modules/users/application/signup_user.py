import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.modules.users.domain.email_sender import EmailSender
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import EmailAlreadyTaken, UsernameAlreadyTaken
from app.modules.users.domain.repositories import (
    EmailVerificationTokenRepository,
    UserRepository,
)


class SignUpUserUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: EmailVerificationTokenRepository,
        email_sender: EmailSender,
        frontend_base_url: str,
        token_ttl_hours: int,
    ) -> None:
        self._user_repo = user_repo
        self._token_repo = token_repo
        self._email_sender = email_sender
        self._frontend_base_url = frontend_base_url
        self._token_ttl_hours = token_ttl_hours

    def execute(self, username: str, email: str, password: str) -> User:
        username = username.lower()

        if self._user_repo.get_by_username(username):
            raise UsernameAlreadyTaken

        if self._user_repo.get_by_email(email):
            raise EmailAlreadyTaken

        user = self._user_repo.add(
            User(
                id=None,
                username=username,
                email=email,
                password_hash=hash_password(password),
                email_verified=False,
                created_at=None,
                updated_at=None,
            )
        )

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=self._token_ttl_hours)
        self._token_repo.add(user.id, token_hash, expires_at)

        link = f"{self._frontend_base_url}/verify-email?token={raw_token}"
        self._email_sender.send_verification(to=email, link=link)

        return user
