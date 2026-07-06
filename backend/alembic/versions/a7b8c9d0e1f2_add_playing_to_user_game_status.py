"""add playing to user_game_status

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-07-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction block on Postgres.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_game_status ADD VALUE IF NOT EXISTS 'playing'")


def downgrade() -> None:
    # Removing a value from a Postgres enum is not supported; no-op by design.
    pass
