import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

_SPECIAL_CHAR_RE = re.compile(r'[!@#$%^&*(),.?":{}|<>]')
_USERNAME_RE = re.compile(r'^[a-zA-Z0-9_]+$')


class SignUpRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 30:
            raise ValueError("Username deve ter entre 3 e 30 caracteres.")
        if not _USERNAME_RE.match(v):
            raise ValueError("Username pode conter apenas letras, números e _.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres.")
        if len(v) > 128:
            raise ValueError("Senha deve ter no máximo 128 caracteres.")
        if not _SPECIAL_CHAR_RE.search(v):
            raise ValueError("Senha deve conter pelo menos um caractere especial.")
        return v


class SignUpResponse(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VerifyEmailRequest(BaseModel):
    token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class LoginResponse(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool

    model_config = {"from_attributes": True}


MeResponse = LoginResponse


class GoogleAuthRequest(BaseModel):
    credential: str
