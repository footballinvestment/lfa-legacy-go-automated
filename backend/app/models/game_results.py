# === backend/app/models/game_results.py ===
# Game Results Tracking System Models for LFA Legacy GO - JAVÍTOTT VERZIÓ
# Complete game results, player statistics, and leaderboard system

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Float,
    Text,
    JSON,
    ForeignKey,
    Enum,
    UniqueConstraint,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database import Base
from typing import Optional, Dict, List, Any
from enum import Enum as PyEnum
from pydantic import BaseModel, validator
import uuid

# === GAME RESULTS ENUMS ===


class GameResultStatus(str, PyEnum):
    """Game result status"""

    PENDING = "pending"  # Game completed but not verified
    VERIFIED = "verified"  # Result verified and official
    DISPUTED = "disputed"  # Result is being disputed
    CANCELLED = "cancelled"  # Game was cancelled
    INVALID = "invalid"  # Invalid result (cheating, technical issues)


class PerformanceLevel(str, PyEnum):
    """Player performance level categories"""

    BEGINNER = "beginner"  # 0-25th percentile
    INTERMEDIATE = "intermediate"  # 25-75th percentile
    ADVANCED = "advanced"  # 75-95th percentile
    EXPERT = "expert"  # 95-99th percentile
    MASTER = "master"  # 99th+ percentile


class SkillCategory(str, PyEnum):
    """Skill categories for analysis"""

    ACCURACY = "accuracy"
    POWER = "power"
    SPEED = "speed"
    TECHNIQUE = "technique"
    CONSISTENCY = "consistency"
    ENDURANCE = "endurance"


# === GAME RESULT MODEL ===


class GameResult(Base):
    """
    Individual game result with comprehensive tracking and analysis
    """

    __tablename__ = "game_results"

    # Primary identification
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(String(50), unique=True, index=True, nullable=False)

    # Game Information
    game_type = Column(
        String(20), nullable=False, index=True
    )  # "GAME1", "GAME2", "GAME3"
    game_session_id = Column(
        String(50), ForeignKey("game_sessions.session_id"), nullable=True
    )
    tournament_id = Column(
        Integer, ForeignKey("tournaments.id"), nullable=True, index=True
    )

    # Player Information
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    player_username = Column(String(50), nullable=False)  # Denormalized for performance
    player_level_at_time = Column(Integer, nullable=False)

    # Location and Timing
    location_id = Column(
        Integer, ForeignKey("locations.id"), nullable=False, index=True
    )
    played_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    duration_seconds = Column(Integer, nullable=False)

    # Core Results
    final_score = Column(Integer, nullable=False, index=True)
    max_possible_score = Column(Integer, nullable=False, default=100)
    percentage_score = Column(
        Float, nullable=False, index=True
    )  # final_score / max_possible_score * 100

    # Performance Metrics
    accuracy_percentage = Column(Float, nullable=True)
    speed_score = Column(Float, nullable=True)
    power_score = Column(Float, nullable=True)
    technique_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    endurance_score = Column(Float, nullable=True)

    # Detailed Performance Data
    performance_data = Column(JSON, default=dict)  # Raw performance metrics
    skill_breakdown = Column(JSON, default=dict)  # Detailed skill analysis
    improvement_areas = Column(JSON, default=list)  # Areas for improvement

    # Weather and Environmental Factors
    weather_conditions = Column(JSON, default=dict)
    environmental_factors = Column(JSON, default=dict)
    equipment_used = Column(JSON, default=dict)

    # Achievement and Progress
    achievements_earned = Column(JSON, default=list)
    milestones_reached = Column(JSON, default=list)
    personal_best = Column(Boolean, default=False)
    season_best = Column(Boolean, default=False)

    # Result Verification and Quality
    status = Column(
        Enum(GameResultStatus), default=GameResultStatus.PENDING, index=True
    )
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_notes = Column(Text, nullable=True)
    confidence_score = Column(Float, default=100.0)  # AI confidence in result accuracy

    # Comparative Analysis
    performance_level = Column(Enum(PerformanceLevel), nullable=True, index=True)
    percentile_rank = Column(
        Float, nullable=True
    )  # Player's percentile among all players
    level_percentile = Column(
        Float, nullable=True
    )  # Percentile among same-level players
    location_rank = Column(Integer, nullable=True)  # Rank at this specific location

    # Training and Coaching Integration
    training_session_id = Column(String(50), nullable=True)
    coach_notes = Column(Text, nullable=True)
    recommended_exercises = Column(JSON, default=list)
    skill_focus_areas = Column(JSON, default=list)

    # Social and Competitive Features
    shared_publicly = Column(Boolean, default=True)
    challenge_result = Column(Boolean, default=False)
    opponent_player_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    competitive_rating_change = Column(Float, default=0.0)

    # Analytics and Machine Learning
    anomaly_score = Column(Float, default=0.0)  # ML-detected anomalies
    trend_indicators = Column(JSON, default=dict)  # Performance trend data
    prediction_accuracy = Column(Float, nullable=True)  # How close to AI prediction

    # Metadata and Audit
    result_source = Column(String(20), default="manual")  # manual, auto, import
    data_quality_score = Column(Float, default=100.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ✅ JAVÍTOTT: Relationships
    location = relationship("Location", back_populates="game_results")
    game_session = relationship("GameSession", back_populates="game_results_records")

    # Indexes for performance
    __table_args__ = (
        Index("idx_player_game_date", "player_id", "game_type", "played_at"),
        Index("idx_location_date_score", "location_id", "played_at", "final_score"),
        Index("idx_performance_level_score", "performance_level", "percentage_score"),
        Index("idx_tournament_player", "tournament_id", "player_id"),
    )

    def __repr__(self):
        return f"<GameResult(id='{self.result_id}', player={self.player_id}, score={self.final_score}, game='{self.game_type}')>"

    @property
    def is_verified(self) -> bool:
        """Check if result is verified"""
        return self.status == GameResultStatus.VERIFIED

    @property
    def is_personal_best(self) -> bool:
        """Check if this is a personal best score"""
        return self.personal_best

    @property
    def efficiency_score(self) -> float:
        """Calculate efficiency based on score per second"""
        if self.duration_seconds == 0:
            return 0.0
        return self.final_score / (self.duration_seconds / 60)  # Score per minute

    def calculate_skill_rating(self) -> float:
        """Calculate overall skill rating from individual components"""
        skill_components = [
            self.accuracy_percentage or 0,
            self.speed_score or 0,
            self.power_score or 0,
            self.technique_score or 0,
            self.consistency_score or 0,
            self.endurance_score or 0,
        ]

        valid_components = [score for score in skill_components if score > 0]
        if not valid_components:
            return 0.0

        return sum(valid_components) / len(valid_components)

    def update_performance_level(self, all_players_percentile: float):
        """Update performance level based on percentile ranking"""
        if all_players_percentile >= 99:
            self.performance_level = PerformanceLevel.MASTER
        elif all_players_percentile >= 95:
            self.performance_level = PerformanceLevel.EXPERT
        elif all_players_percentile >= 75:
            self.performance_level = PerformanceLevel.ADVANCED
        elif all_players_percentile >= 25:
            self.performance_level = PerformanceLevel.INTERMEDIATE
        else:
            self.performance_level = PerformanceLevel.BEGINNER

        self.percentile_rank = all_players_percentile

    def add_achievement(self, achievement_id: str, description: str):
        """Add an achievement to this result"""
        if not self.achievements_earned:
            self.achievements_earned = []

        achievement = {
            "id": achievement_id,
            "description": description,
            "earned_at": datetime.utcnow().isoformat(),
        }
        self.achievements_earned.append(achievement)


# === PLAYER STATISTICS MODEL ===


class PlayerStatistics(Base):
    """
    Aggregated player statistics for leaderboards and analysis
    """

    __tablename__ = "player_statistics"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True
    )

    # Last Updated
    last_updated = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_game_played = Column(DateTime(timezone=True), nullable=True)

    # Overall Statistics
    total_games = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    best_score = Column(Integer, default=0)
    worst_score = Column(Integer, default=0)

    # Performance Metrics
    average_accuracy = Column(Float, default=0.0)
    average_speed = Column(Float, default=0.0)
    average_power = Column(Float, default=0.0)
    average_technique = Column(Float, default=0.0)
    average_consistency = Column(Float, default=0.0)
    average_endurance = Column(Float, default=0.0)

    # Skill Ratings
    overall_skill_rating = Column(Float, default=0.0, index=True)
    accuracy_rating = Column(Float, default=0.0)
    speed_rating = Column(Float, default=0.0)
    power_rating = Column(Float, default=0.0)
    technique_rating = Column(Float, default=0.0)
    consistency_rating = Column(Float, default=0.0)
    endurance_rating = Column(Float, default=0.0)

    # Rankings and Percentiles
    global_rank = Column(Integer, nullable=True, index=True)
    level_rank = Column(Integer, nullable=True)
    location_rank = Column(Integer, nullable=True)
    percentile_rank = Column(Float, default=0.0)
    performance_level = Column(Enum(PerformanceLevel), nullable=True)

    # Game-Specific Statistics
    game1_stats = Column(JSON, default=dict)
    game2_stats = Column(JSON, default=dict)
    game3_stats = Column(JSON, default=dict)
    game4_stats = Column(JSON, default=dict)
    game5_stats = Column(JSON, default=dict)

    # Improvement Tracking
    improvement_rate = Column(Float, default=0.0)
    streak_current = Column(Integer, default=0)
    streak_best = Column(Integer, default=0)
    personal_bests_count = Column(Integer, default=0)

    # Recent Performance (last 30 days)
    recent_games = Column(Integer, default=0)
    recent_average = Column(Float, default=0.0)
    recent_improvement = Column(Float, default=0.0)

    # Achievements and Milestones
    total_achievements = Column(Integer, default=0)
    rare_achievements = Column(Integer, default=0)
    first_places = Column(Integer, default=0)
    podium_finishes = Column(Integer, default=0)

    def __repr__(self):
        return f"<PlayerStatistics(player={self.player_id}, rating={self.overall_skill_rating:.1f}, rank={self.global_rank})>"

    def update_with_new_result(self, game_result: GameResult):
        """Update statistics with a new game result"""
        # Update basic stats
        self.total_games += 1
        self.total_score += game_result.final_score
        self.average_score = self.total_score / self.total_games

        # Update best/worst scores
        if game_result.final_score > self.best_score:
            self.best_score = game_result.final_score
        if self.worst_score == 0 or game_result.final_score < self.worst_score:
            self.worst_score = game_result.final_score

        # Update skill averages (if data available)
        if game_result.accuracy_percentage:
            self.average_accuracy = self._update_average(
                self.average_accuracy, game_result.accuracy_percentage, self.total_games
            )

        if game_result.speed_score:
            self.average_speed = self._update_average(
                self.average_speed, game_result.speed_score, self.total_games
            )

        # Update last played
        self.last_game_played = game_result.played_at
        self.last_updated = datetime.utcnow()

        # Update personal bests count
        if game_result.personal_best:
            self.personal_bests_count += 1

    def _update_average(
        self, current_avg: float, new_value: float, total_count: int
    ) -> float:
        """Update running average with new value"""
        if total_count == 1:
            return new_value
        return ((current_avg * (total_count - 1)) + new_value) / total_count


# === LEADERBOARD MODEL ===


class Leaderboard(Base):
    """
    Leaderboard entries for different categories and time periods
    """

    __tablename__ = "leaderboards"

    id = Column(Integer, primary_key=True, index=True)
    leaderboard_id = Column(String(50), index=True, nullable=False)

    # Leaderboard Configuration
    category = Column(
        String(50), nullable=False, index=True
    )  # overall, game1, game2, etc.
    time_period = Column(
        String(20), nullable=False, index=True
    )  # all_time, monthly, weekly, daily
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    level_range = Column(String(20), nullable=True)  # "1-10", "11-25", etc.

    # Player Information
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    player_username = Column(String(50), nullable=False)
    player_level = Column(Integer, nullable=False)

    # Ranking Information
    rank = Column(Integer, nullable=False, index=True)
    score = Column(Float, nullable=False)
    games_played = Column(Integer, default=0)
    average_score = Column(Float, nullable=False)

    # Additional Metrics
    improvement_rate = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    recent_activity = Column(Integer, default=0)  # Games in period

    # Metadata
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    last_updated = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Unique constraint for each leaderboard entry
    __table_args__ = (
        UniqueConstraint(
            "leaderboard_id", "player_id", name="unique_leaderboard_entry"
        ),
        Index("idx_leaderboard_rank", "leaderboard_id", "rank"),
        Index("idx_category_period_rank", "category", "time_period", "rank"),
    )

    def __repr__(self):
        return f"<Leaderboard(id='{self.leaderboard_id}', player={self.player_id}, rank={self.rank})>"


# === ACHIEVEMENT TRACKING MODEL ===


class GameAchievement(Base):
    """
    Game-specific achievements that players can earn
    """

    __tablename__ = "game_achievements"

    id = Column(Integer, primary_key=True, index=True)
    achievement_id = Column(String(50), unique=True, index=True, nullable=False)

    # Achievement Details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(20), default="normal")  # easy, normal, hard, legendary

    # Requirements
    requirements = Column(JSON, nullable=False)
    game_types = Column(JSON, default=list)  # Which games this applies to

    # Rewards
    reward_credits = Column(Integer, default=0)
    reward_xp = Column(Integer, default=0)
    reward_items = Column(JSON, default=list)

    # Achievement Metadata
    icon_url = Column(String(255), nullable=True)
    badge_color = Column(String(7), default="#FFD700")
    is_active = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)  # Hidden until earned

    # Statistics
    total_earned = Column(Integer, default=0)
    rarity_score = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<GameAchievement(id='{self.achievement_id}', name='{self.name}')>"


class PlayerAchievement(Base):
    """
    Player's earned achievements
    """

    __tablename__ = "player_achievements"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = Column(
        String(50), ForeignKey("game_achievements.achievement_id"), nullable=False
    )
    game_result_id = Column(
        String(50), ForeignKey("game_results.result_id"), nullable=True
    )

    # Achievement Details
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    progress_data = Column(JSON, default=dict)

    # Relationships
    achievement = relationship("GameAchievement")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint(
            "player_id", "achievement_id", name="unique_player_achievement"
        ),
    )

    def __repr__(self):
        return f"<PlayerAchievement(player={self.player_id}, achievement='{self.achievement_id}')>"
