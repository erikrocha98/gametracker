from dataclasses import dataclass
from typing import Protocol


@dataclass
class GoogleIdentity:
    sub: str
    email: str
    email_verified: bool
    name: str


class GoogleTokenVerifier(Protocol):
    def verify(self, id_token: str) -> GoogleIdentity: ...
