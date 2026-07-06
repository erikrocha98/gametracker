import pytest

from app.modules.users.application.update_bio import MAX_BIO_LENGTH, UpdateBioUseCase
from app.modules.users.domain.entities import User
from app.modules.users.domain.exceptions import BioTooLong


def _add_user(user_repo) -> User:
    return user_repo.add(
        User(
            id=None,
            username="erik",
            email="erik@test.com",
            password_hash="hash",
            email_verified=True,
            created_at=None,
            updated_at=None,
        )
    )


def test_update_bio_sets_bio(user_repo):
    user = _add_user(user_repo)

    updated = UpdateBioUseCase(user_repo=user_repo).execute(user.id, "Gamer desde 1998.")

    assert updated.bio == "Gamer desde 1998."
    assert user_repo.get_by_id(user.id).bio == "Gamer desde 1998."


def test_update_bio_strips_whitespace(user_repo):
    user = _add_user(user_repo)

    updated = UpdateBioUseCase(user_repo=user_repo).execute(user.id, "  minha bio  ")

    assert updated.bio == "minha bio"


def test_update_bio_accepts_none(user_repo):
    user = _add_user(user_repo)

    updated = UpdateBioUseCase(user_repo=user_repo).execute(user.id, None)

    assert updated.bio is None


def test_update_bio_empty_string_becomes_none(user_repo):
    user = _add_user(user_repo)

    updated = UpdateBioUseCase(user_repo=user_repo).execute(user.id, "   ")

    assert updated.bio is None


def test_update_bio_accepts_max_length(user_repo):
    user = _add_user(user_repo)
    bio = "a" * MAX_BIO_LENGTH

    updated = UpdateBioUseCase(user_repo=user_repo).execute(user.id, bio)

    assert updated.bio == bio


def test_update_bio_rejects_too_long(user_repo):
    user = _add_user(user_repo)
    bio = "a" * (MAX_BIO_LENGTH + 1)

    with pytest.raises(BioTooLong):
        UpdateBioUseCase(user_repo=user_repo).execute(user.id, bio)
