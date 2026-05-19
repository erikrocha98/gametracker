from typing import Protocol


class EmailSender(Protocol):
    def send_verification(self, *, to: str, link: str) -> None: ...
