# Cross-module import permitted here: this adapter is the composition edge that
# wires game_lists domain (GameCatalog port) to the games module infrastructure.
from app.modules.games.application.get_game_details import GetGameDetailsUseCase
from app.modules.games.domain.repositories import UserGameRepository


class GamesCatalogAdapter:
    def __init__(
        self,
        details_use_case: GetGameDetailsUseCase,
        user_game_repository: UserGameRepository,
    ) -> None:
        self._details_use_case = details_use_case
        self._user_game_repository = user_game_repository

    def ensure_game(self, external_id: str) -> int:
        self._details_use_case.execute(external_id)
        return self._user_game_repository.find_internal_game_id(external_id)

    def resolve_game_id(self, external_id: str) -> int | None:
        return self._user_game_repository.find_internal_game_id(external_id)
