from app.modules.games.domain.repositories import UserGameRepository


class GetUserGameRatingUseCase:
    def __init__(self, repository: UserGameRepository) -> None:
        self._repository = repository

    def execute(self, *, user_id: int, external_id: str) -> float | None:
        internal_id = self._repository.find_internal_game_id(external_id)
        if internal_id is None:
            return None
        entry = self._repository.get(user_id=user_id, game_id=internal_id)
        return entry.rating if entry else None
