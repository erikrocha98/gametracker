from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.infrastructure.email_sender_console import ConsoleEmailSender
from app.modules.users.infrastructure.repositories import (
    SQLAlchemyEmailVerificationTokenRepository,
    SQLAlchemyUserRepository,
)


def get_signup_use_case(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> SignUpUserUseCase:
    return SignUpUserUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        token_repo=SQLAlchemyEmailVerificationTokenRepository(db),
        email_sender=ConsoleEmailSender(),
        frontend_base_url=settings.frontend_base_url,
        token_ttl_hours=settings.email_verification_token_ttl_hours,
    )


def get_verify_email_use_case(
    db: Session = Depends(get_db),
) -> VerifyEmailUseCase:
    return VerifyEmailUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        token_repo=SQLAlchemyEmailVerificationTokenRepository(db),
    )
