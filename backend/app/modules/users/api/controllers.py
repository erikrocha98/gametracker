from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.config import Settings, get_settings
from app.core.security import create_access_token
from app.modules.users.api.dependencies import (
    get_current_user,
    get_google_auth_use_case,
    get_login_use_case,
    get_signup_use_case,
    get_verify_email_use_case,
)
from app.modules.users.api.schemas import (
    GoogleAuthRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
    SignUpRequest,
    SignUpResponse,
    VerifyEmailRequest,
)
from app.modules.users.application.google_auth import GoogleAuthUseCase
from app.modules.users.application.login_user import LoginUserUseCase
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import (
    EmailAlreadyTaken,
    ExpiredVerificationToken,
    InvalidCredentials,
    InvalidGoogleToken,
    InvalidVerificationToken,
    UsedVerificationToken,
    UsernameAlreadyTaken,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=201, response_model=SignUpResponse)
def signup(
    payload: SignUpRequest,
    use_case: SignUpUserUseCase = Depends(get_signup_use_case),
):
    try:
        user = use_case.execute(
            username=payload.username,
            email=str(payload.email),
            password=payload.password,
        )
        return SignUpResponse.model_validate(user)
    except UsernameAlreadyTaken:
        raise HTTPException(status_code=409, detail="Username já em uso.")
    except EmailAlreadyTaken:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")


@router.post("/verify-email", status_code=204)
def verify_email(
    payload: VerifyEmailRequest,
    use_case: VerifyEmailUseCase = Depends(get_verify_email_use_case),
):
    try:
        use_case.execute(payload.token)
    except InvalidVerificationToken:
        raise HTTPException(status_code=400, detail="Token inválido.")
    except ExpiredVerificationToken:
        raise HTTPException(status_code=400, detail="Token expirado.")
    except UsedVerificationToken:
        raise HTTPException(status_code=400, detail="Token já utilizado.")


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    response: Response,
    use_case: LoginUserUseCase = Depends(get_login_use_case),
    settings: Settings = Depends(get_settings),
):
    try:
        user = use_case.execute(email=str(payload.email), password=payload.password)
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    if payload.remember_me:
        expires_delta = timedelta(days=settings.jwt_remember_me_ttl_days)
        max_age = int(expires_delta.total_seconds())
    else:
        expires_delta = timedelta(hours=settings.jwt_access_ttl_hours)
        max_age = None

    token = create_access_token(user.id, expires_delta, settings.jwt_secret)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
        max_age=max_age,
    )
    return LoginResponse.model_validate(user)


@router.post("/logout", status_code=204)
def logout(response: Response, settings: Settings = Depends(get_settings)):
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )


@router.post("/google", response_model=LoginResponse)
def google_auth(
    payload: GoogleAuthRequest,
    response: Response,
    use_case: GoogleAuthUseCase = Depends(get_google_auth_use_case),
    settings: Settings = Depends(get_settings),
):
    try:
        user = use_case.execute(payload.credential)
    except InvalidGoogleToken:
        raise HTTPException(status_code=401, detail="Não foi possível autenticar com o Google.")

    expires_delta = timedelta(hours=settings.jwt_access_ttl_hours)
    token = create_access_token(user.id, expires_delta, settings.jwt_secret)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    return LoginResponse.model_validate(user)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return MeResponse.model_validate(current_user)
