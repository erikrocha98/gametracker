"""add status to user_games

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE user_game_status AS ENUM ('want_to_play', 'finished')")
    op.add_column(
        "user_games",
        sa.Column(
            "status",
            sa.Enum("want_to_play", "finished", name="user_game_status"),
            nullable=False,
            server_default="want_to_play",
        ),
    )


def downgrade() -> None:
    op.drop_column("user_games", "status")
    op.execute("DROP TYPE user_game_status")
