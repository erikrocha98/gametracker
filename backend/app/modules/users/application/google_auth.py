import re

from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import InvalidGoogleToken
from app.modules.users.domain.google_identity import GoogleTokenVerifier
from app.modules.users.domain.repositories import UserRepository

_INVALID_CHARS_RE = re.compile(r"[^a-z0-9_]")
_MAX_BASE_LEN = 46


class GoogleAuthUseCase:
    def __init__(self, user_repo: UserRepository, token_verifier: GoogleTokenVerifier) -> None:
        self._user_repo = user_repo
        self._token_verifier = token_verifier

    def execute(self, id_token: str) -> User:
        identity = self._token_verifier.verify(id_token)

        if not identity.email_verified:
            raise InvalidGoogleToken

        user = self._user_repo.get_by_google_id(identity.sub)
        if user:
            return user

        user = self._user_repo.get_by_email(identity.email)
        if user:
            self._user_repo.link_google_account(user.id, identity.sub)
            return self._user_repo.get_by_id(user.id)

        username = self._generate_unique_username(identity.email)
        return self._user_repo.add(
            User(
                id=None,
                username=username,
                email=identity.email,
                password_hash=None,
                email_verified=True,
                google_id=identity.sub,
                created_at=None,
                updated_at=None,
            )
        )

    def _generate_unique_username(self, email: str) -> str:
        local = email.split("@")[0].lower()
        base = _INVALID_CHARS_RE.sub("", local)[:_MAX_BASE_LEN] or "user"

        if not self._user_repo.get_by_username(base):
            return base

        for i in range(1, 10_000):
            candidate = f"{base}{i}"
            if not self._user_repo.get_by_username(candidate):
                return candidate

        raise RuntimeError("Could not generate a unique username")
