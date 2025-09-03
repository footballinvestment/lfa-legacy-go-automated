# === backend/app/models/match_results.py ===
# Simple Match Results Model for UI Game Results Form

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.sql import func
from ..database import Base
from datetime import datetime
from typing import Optional


class MatchResult(Base):
    """
    Simple match results for UI form - separate from complex GameResult model
    """

    __tablename__ = "match_results"

    # Primary identification
    id = Column(Integer, primary_key=True, index=True)

    # Players
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    opponent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Match details
    game_type = Column(String(50), nullable=False, index=True)
    my_score = Column(Integer, nullable=False)
    opponent_score = Column(Integer, nullable=False)
    result = Column(String(10), nullable=False)  # "win", "loss", "draw"
    score = Column(String(20), nullable=False)  # "2-1" format

    # Game info
    duration = Column(Integer, nullable=False)  # minutes
    location = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)

    # Optional tournament
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)

    # Timestamps
    played_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<MatchResult(id={self.id}, user={self.user_id} vs {self.opponent_id}, score={self.score}, result={self.result})>"

    @property
    def is_win(self) -> bool:
        return self.result == "win"

    @property
    def is_loss(self) -> bool:
        return self.result == "loss"

    @property
    def is_draw(self) -> bool:
        return self.result == "draw"