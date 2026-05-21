from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.modules.users.domain.entities import EmailVerificationToken, User
from app.modules.users.infrastructure.models import (
    EmailVerificationTokenModel,
    UserModel,
)


class SQLAlchemyUserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_username(self, username: str) -> User | None:
        model = self._db.query(UserModel).filter_by(username=username).first()
        return self._to_entity(model) if model else None

    def get_by_email(self, email: str) -> User | None:
        model = self._db.query(UserModel).filter_by(email=email).first()
        return self._to_entity(model) if model else None

    def get_by_id(self, user_id: int) -> User | None:
        model = self._db.get(UserModel, user_id)
        return self._to_entity(model) if model else None

    def get_by_google_id(self, google_id: str) -> User | None:
        model = self._db.query(UserModel).filter_by(google_id=google_id).first()
        return self._to_entity(model) if model else None

    def add(self, user: User) -> User:
        model = UserModel(
            username=user.username,
            email=user.email,
            password_hash=user.password_hash,
            email_verified=user.email_verified,
            google_id=user.google_id,
        )
        self._db.add(model)
        self._db.flush()
        return self._to_entity(model)

    def mark_email_verified(self, user_id: int) -> None:
        model = self._db.get(UserModel, user_id)
        if model:
            model.email_verified = True
            model.updated_at = datetime.now(timezone.utc)

    def link_google_account(self, user_id: int, google_id: str) -> None:
        model = self._db.get(UserModel, user_id)
        if model:
            model.google_id = google_id
            model.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def _to_entity(model: UserModel) -> User:
        return User(
            id=model.id,
            username=model.username,
            email=model.email,
            password_hash=model.password_hash,
            email_verified=model.email_verified,
            google_id=model.google_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class SQLAlchemyEmailVerificationTokenRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def add(self, user_id: int, token_hash: str, expires_at: datetime) -> EmailVerificationToken:
        model = EmailVerificationTokenModel(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._db.add(model)
        self._db.flush()
        return self._to_entity(model)

    def get_by_hash(self, token_hash: str) -> EmailVerificationToken | None:
        model = (
            self._db.query(EmailVerificationTokenModel)
            .filter_by(token_hash=token_hash)
            .first()
        )
        return self._to_entity(model) if model else None

    def mark_used(self, token_id: int) -> None:
        model = self._db.get(EmailVerificationTokenModel, token_id)
        if model:
            model.used_at = datetime.now(timezone.utc)

    @staticmethod
    def _to_entity(model: EmailVerificationTokenModel) -> EmailVerificationToken:
        return EmailVerificationToken(
            id=model.id,
            user_id=model.user_id,
            token_hash=model.token_hash,
            expires_at=model.expires_at,
            used_at=model.used_at,
            created_at=model.created_at,
        )
