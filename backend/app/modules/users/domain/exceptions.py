class UsernameAlreadyTaken(Exception):
    pass


class EmailAlreadyTaken(Exception):
    pass


class InvalidVerificationToken(Exception):
    pass


class ExpiredVerificationToken(Exception):
    pass


class UsedVerificationToken(Exception):
    pass
