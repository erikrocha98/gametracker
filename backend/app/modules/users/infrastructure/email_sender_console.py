import logging

logger = logging.getLogger(__name__)


class ConsoleEmailSender:
    def send_verification(self, *, to: str, link: str) -> None:
        logger.info("VERIFICATION_EMAIL to=%s link=%s", to, link)
