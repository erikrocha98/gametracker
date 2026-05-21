import jwt as pyjwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.modules.users.application.google_auth import GoogleAuthUseCase
from app.modules.users.application.login_user import LoginUserUseCase
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.entities import User
from app.modules.users.infrastructure.email_sender_console import ConsoleEmailSender
from app.modules.users.infrastructure.google_token_verifier import GoogleIdTokenVerifier
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


def get_login_use_case(db: Session = Depends(get_db)) -> LoginUserUseCase:
    return LoginUserUseCase(user_repo=SQLAlchemyUserRepository(db))


def get_google_auth_use_case(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> GoogleAuthUseCase:
    return GoogleAuthUseCase(
        user_repo=SQLAlchemyUserRepository(db),
        token_verifier=GoogleIdTokenVerifier(settings.google_client_id),
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    try:
        user_id = decode_access_token(token, settings.jwt_secret)
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    user = SQLAlchemyUserRepository(db).get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    return user
