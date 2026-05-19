from fastapi import APIRouter, Depends, HTTPException

from app.modules.users.api.dependencies import (
    get_signup_use_case,
    get_verify_email_use_case,
)
from app.modules.users.api.schemas import SignUpRequest, SignUpResponse, VerifyEmailRequest
from app.modules.users.application.signup_user import SignUpUserUseCase
from app.modules.users.application.verify_email import VerifyEmailUseCase
from app.modules.users.domain.exceptions import (
    EmailAlreadyTaken,
    ExpiredVerificationToken,
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
