from app.modules.games.domain.entities import GameDetail
from app.modules.games.domain.repositories import GameDetailProvider, GameRepository


class GetGameDetailsUseCase:
    def __init__(self, provider: GameDetailProvider, repository: GameRepository) -> None:
        self._provider = provider
        self._repository = repository

    def execute(self, game_id: str) -> GameDetail:
        cached = self._repository.find_by_id(game_id)
        if cached:
            return cached
        detail = self._provider.get_by_id(game_id)
        self._repository.save(detail)
        return detail
