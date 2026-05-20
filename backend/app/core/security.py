from datetime import datetime, timedelta, timezone

import bcrypt
import jwt as pyjwt

_BCRYPT_ROUNDS = 12

_DUMMY_PASSWORD_HASH: str = bcrypt.hashpw(
    b"dummy_constant_time_defense", bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
).decode()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int, expires_delta: timedelta, secret: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + expires_delta}
    return pyjwt.encode(payload, secret, algorithm="HS256")


def decode_access_token(token: str, secret: str) -> int:
    payload = pyjwt.decode(token, secret, algorithms=["HS256"])
    return int(payload["sub"])
