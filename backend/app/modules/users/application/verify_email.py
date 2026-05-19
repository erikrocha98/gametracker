import hashlib
from datetime import datetime, timezone

from app.modules.users.domain.exceptions import (
    ExpiredVerificationToken,
    InvalidVerificationToken,
    UsedVerificationToken,
)
from app.modules.users.domain.repositories import (
    EmailVerificationTokenRepository,
    UserRepository,
)


class VerifyEmailUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: EmailVerificationTokenRepository,
    ) -> None:
        self._user_repo = user_repo
        self._token_repo = token_repo

    def execute(self, raw_token: str) -> None:
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        token = self._token_repo.get_by_hash(token_hash)
        if token is None:
            raise InvalidVerificationToken

        if token.used_at is not None:
            raise UsedVerificationToken

        if token.expires_at < datetime.now(timezone.utc):
            raise ExpiredVerificationToken

        self._user_repo.mark_email_verified(token.user_id)
        self._token_repo.mark_used(token.id)
