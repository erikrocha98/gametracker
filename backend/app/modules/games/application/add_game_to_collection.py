from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.entities import UserGame
from app.modules.games.domain.exceptions import GameAlreadyInCollection
from app.modules.games.domain.repositories import UserGameRepository


class AddGameToCollectionUseCase:
    def __init__(
        self,
        details_use_case: GetGameDetailsUseCase,
        repository: UserGameRepository,
    ) -> None:
        self._details_use_case = details_use_case
        self._repository = repository

    def execute(self, *, user_id: int, external_id: str) -> UserGame:
        self._details_use_case.execute(external_id)
        internal_id = self._repository.find_internal_game_id(external_id)
        if self._repository.exists(user_id=user_id, game_id=internal_id):
            raise GameAlreadyInCollection
        return self._repository.add(user_id=user_id, game_id=internal_id)
