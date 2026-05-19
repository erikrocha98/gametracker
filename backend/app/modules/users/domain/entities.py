from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int | None
    username: str
    email: str
    password_hash: str | None
    email_verified: bool
    created_at: datetime | None
    updated_at: datetime | None


@dataclass
class EmailVerificationToken:
    id: int | None
    user_id: int
    token_hash: str
    expires_at: datetime
    used_at: datetime | None
    created_at: datetime | None
