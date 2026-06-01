from app.modules.games.domain.exceptions import GameNotInCollection
from app.modules.games.domain.repositories import UserGameRepository


class RemoveRatingUseCase:
    def __init__(self, repository: UserGameRepository) -> None:
        self._repository = repository

    def execute(self, *, user_id: int, external_id: str) -> None:
        internal_id = self._repository.find_internal_game_id(external_id)
        if internal_id is None or not self._repository.clear_rating(
            user_id=user_id, game_id=internal_id
        ):
            raise GameNotInCollection
