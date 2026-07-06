from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import BioTooLong
from app.modules.users.domain.repositories import UserRepository

MAX_BIO_LENGTH = 500


class UpdateBioUseCase:
    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    def execute(self, user_id: int, bio: str | None) -> User:
        normalized = bio.strip() if bio else None

        if normalized is not None and len(normalized) > MAX_BIO_LENGTH:
            raise BioTooLong

        return self._user_repo.update_bio(user_id, normalized)
