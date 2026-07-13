from dataclasses import dataclass
from datetime import datetime

# Limite de jogos por lista. Débito técnico: só será aplicado quando a
# associação lista↔jogo (tabela game_list_items) existir. Mantido aqui como
# regra de domínio pronta para uso futuro.
MAX_GAMES_PER_LIST = 50


@dataclass
class GameList:
    id: int
    user_id: int
    name: str
    description: str | None
    is_public: bool
    created_at: datetime
    updated_at: datetime
