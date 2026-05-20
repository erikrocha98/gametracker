from app.core.security import _DUMMY_PASSWORD_HASH, verify_password
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import InvalidCredentials
from app.modules.users.domain.repositories import UserRepository


class LoginUserUseCase:
    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    def execute(self, email: str, password: str) -> User:
        user = self._user_repo.get_by_email(email)

        if user is None:
            verify_password(password, _DUMMY_PASSWORD_HASH)
            raise InvalidCredentials

        if user.password_hash is None:
            raise InvalidCredentials

        if not verify_password(password, user.password_hash):
            raise InvalidCredentials

        return user
