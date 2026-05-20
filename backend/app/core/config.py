from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    frontend_base_url: str = "http://localhost:5173"
    email_verification_token_ttl_hours: int = 24
    jwt_secret: str
    jwt_access_ttl_hours: int = 12
    jwt_remember_me_ttl_days: int = 30
    cookie_secure: bool = True

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
