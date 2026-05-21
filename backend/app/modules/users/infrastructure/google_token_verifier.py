from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.modules.users.domain.exceptions import InvalidGoogleToken
from app.modules.users.domain.google_identity import GoogleIdentity


class GoogleIdTokenVerifier:
    def __init__(self, client_id: str) -> None:
        self._client_id = client_id

    def verify(self, token: str) -> GoogleIdentity:
        try:
            info = id_token.verify_oauth2_token(
                token, google_requests.Request(), self._client_id
            )
        except ValueError as exc:
            raise InvalidGoogleToken from exc

        return GoogleIdentity(
            sub=info["sub"],
            email=info["email"],
            email_verified=bool(info.get("email_verified", False)),
            name=info.get("name", ""),
        )
