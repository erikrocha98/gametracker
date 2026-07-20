"""add review to user_games

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-07-20 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "d0e1f2a3b4c5"
down_revision: Union[str, None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_games", sa.Column("review", sa.Text(), nullable=True))
    op.add_column("user_games", sa.Column("review_created_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user_games", sa.Column("review_updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("user_games", "review_updated_at")
    op.drop_column("user_games", "review_created_at")
    op.drop_column("user_games", "review")
