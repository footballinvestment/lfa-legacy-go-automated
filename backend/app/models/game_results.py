# === backend/app/models/game_results.py ===
# Game Results Tracking System Models for LFA Legacy GO - JAVÍTOTT VERZIÓ
# Complete game results, player statistics, and leaderboard system

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, JSON, ForeignKey, Enum, UniqueConstraint, Index
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
    PENDING = "pending"        # Game completed but not verified
    VERIFIED = "verified"      # Result verified and official
    DISPUTED = "disputed"      # Result is being disputed
    CANCELLED = "cancelled"    # Game was cancelled
    INVALID = "invalid"        # Invalid result (cheating, technical issues)

class PerformanceLevel(str, PyEnum):
    """Player performance level categories"""
    BEGINNER = "beginner"      # 0-25th percentile
    INTERMEDIATE = "intermediate"  # 25-75th percentile
    ADVANCED = "advanced"      # 75-95th percentile
    EXPERT = "expert"          # 95-99th percentile
    MASTER = "master"          # 99th+ percentile

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
    game_type = Column(String(20), nullable=False, index=True)  # "GAME1", "GAME2", "GAME3"
    game_session_id = Column(String(50), ForeignKey("game_sessions.session_id"), nullable=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True, index=True)
    
    # Player Information
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    player_username = Column(String(50), nullable=False)  # Denormalized for performance
    player_level_at_time = Column(Integer, nullable=False)
    
    # Location and Timing
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    played_at = Column(DateTime, nullable=False, index=True)
    game_duration_minutes = Column(Integer, nullable=False)
    
    # Scoring
    final_score = Column(Integer, nullable=False, index=True)
    max_possible_score = Column(Integer, default=100)
    score_percentage = Column(Float, nullable=False, index=True)  # Calculated percentage
    
    # Detailed Performance Metrics
    accuracy_score = Column(Float, default=0.0)      # 0-100
    power_score = Column(Float, default=0.0)         # 0-100
    speed_score = Column(Float, default=0.0)         # 0-100
    technique_score = Column(Float, default=0.0)     # 0-100
    consistency_score = Column(Float, default=0.0)   # 0-100
    
    # Game-Specific Data
    detailed_results = Column(JSON, nullable=False)  # Game-specific metrics
    attempts = Column(JSON, default=lambda: [])      # Individual attempt data
    milestones = Column(JSON, default=lambda: [])    # Achievements during game
    
    # Performance Analysis
    performance_level = Column(Enum(PerformanceLevel), nullable=False)
    percentile_rank = Column(Float, default=0.0)     # Percentile among all players
    improvement_from_last = Column(Float, default=0.0)  # % improvement from last game
    personal_best = Column(Boolean, default=False)   # Is this a personal best?
    
    # Environmental Factors
    weather_conditions = Column(JSON, nullable=True)  # Weather at time of play
    equipment_used = Column(JSON, default=lambda: [])
    special_conditions = Column(JSON, default=lambda: [])  # Any special circumstances
    
    # Verification and Quality
    status = Column(Enum(GameResultStatus), default=GameResultStatus.PENDING, index=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who recorded it
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)   # Who verified it
    verification_time = Column(DateTime, nullable=True)
    
    # Data Quality
    confidence_score = Column(Float, default=1.0)    # 0-1, how confident we are in the result
    data_source = Column(String(50), default="manual")  # "manual", "automated", "sensor"
    anomaly_flags = Column(JSON, default=lambda: [])  # Any detected anomalies
    
    # Additional Context
    notes = Column(Text, nullable=True)
    tags = Column(JSON, default=lambda: [])          # Searchable tags
    replay_data = Column(JSON, nullable=True)        # For future video/sensor replay
    
    # Rewards and Recognition
    xp_awarded = Column(Integer, default=0)
    credits_awarded = Column(Integer, default=0)
    achievements_unlocked = Column(JSON, default=lambda: [])
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # === RELATIONSHIPS - JAVÍTOTT VERZIÓ overlaps paraméterrel ===
    player = relationship("User", foreign_keys=[player_id])
    recorded_by = relationship("User", foreign_keys=[recorded_by_id], overlaps="coached_results")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    location = relationship("Location")
    game_session = relationship("GameSession", foreign_keys=[game_session_id])
    tournament = relationship("Tournament", foreign_keys=[tournament_id])
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_game_results_player_game', 'player_id', 'game_type'),
        Index('idx_game_results_location_date', 'location_id', 'played_at'),
        Index('idx_game_results_score_rank', 'game_type', 'score_percentage', 'played_at'),
        Index('idx_game_results_leaderboard', 'game_type', 'status', 'final_score'),
    )
    
    def __repr__(self):
        return f"<GameResult(id='{self.result_id}', player='{self.player_username}', game='{self.game_type}', score={self.final_score})>"
    
    @property
    def score_letter_grade(self) -> str:
        """Convert score percentage to letter grade"""
        if self.score_percentage >= 95:
            return "A+"
        elif self.score_percentage >= 90:
            return "A"
        elif self.score_percentage >= 85:
            return "A-"
        elif self.score_percentage >= 80:
            return "B+"
        elif self.score_percentage >= 75:
            return "B"
        elif self.score_percentage >= 70:
            return "B-"
        elif self.score_percentage >= 65:
            return "C+"
        elif self.score_percentage >= 60:
            return "C"
        elif self.score_percentage >= 55:
            return "C-"
        elif self.score_percentage >= 50:
            return "D"
        else:
            return "F"
    
    @property
    def skill_scores(self) -> Dict[str, float]:
        """Get all skill scores as dictionary"""
        return {
            "accuracy": self.accuracy_score,
            "power": self.power_score,
            "speed": self.speed_score,
            "technique": self.technique_score,
            "consistency": self.consistency_score
        }
    
    @property
    def overall_skill_score(self) -> float:
        """Calculate overall skill score"""
        skills = self.skill_scores
        return sum(skills.values()) / len(skills) if skills else 0.0
    
    def generate_result_id(self) -> str:
        """Generate unique result ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_suffix = str(uuid.uuid4().hex[:6]).upper()
        return f"RES_{self.game_type}_{timestamp}_{unique_suffix}"
    
    def calculate_performance_level(self, percentile: float) -> PerformanceLevel:
        """Calculate performance level based on percentile"""
        if percentile >= 99:
            return PerformanceLevel.MASTER
        elif percentile >= 95:
            return PerformanceLevel.EXPERT
        elif percentile >= 75:
            return PerformanceLevel.ADVANCED
        elif percentile >= 25:
            return PerformanceLevel.INTERMEDIATE
        else:
            return PerformanceLevel.BEGINNER
    
    def update_skill_scores(self, detailed_results: Dict[str, Any]):
        """Update skill scores based on detailed game results"""
        # This would be implemented based on game-specific logic
        # For now, we'll use mock calculations
        
        if self.game_type == "GAME1":  # Football Skills Challenge
            self.accuracy_score = detailed_results.get("target_hits", 0) * 10
            self.speed_score = max(0, 100 - (detailed_results.get("completion_time", 120) - 60))
            self.technique_score = detailed_results.get("form_score", 50)
            self.power_score = detailed_results.get("shot_power", 50)
            self.consistency_score = detailed_results.get("consistency_rating", 50)
            
        elif self.game_type == "GAME2":  # Penalty Shootout
            self.accuracy_score = (detailed_results.get("goals_scored", 0) / 
                                 max(1, detailed_results.get("total_shots", 1))) * 100
            self.power_score = detailed_results.get("average_shot_power", 50)
            self.technique_score = detailed_results.get("technique_rating", 50)
            self.consistency_score = detailed_results.get("accuracy_consistency", 50)
            self.speed_score = 50  # Not applicable for penalties
            
        elif self.game_type == "GAME3":  # Speed Challenge
            self.speed_score = detailed_results.get("speed_rating", 50)
            self.accuracy_score = detailed_results.get("precision_score", 50)
            self.technique_score = detailed_results.get("form_score", 50)
            self.consistency_score = detailed_results.get("lap_consistency", 50)
            self.power_score = 50  # Not as applicable for speed challenges
    
    def verify_result(self, verified_by_id: int, notes: str = None):
        """Verify the game result"""
        self.status = GameResultStatus.VERIFIED
        self.verified_by_id = verified_by_id
        self.verification_time = datetime.now()
        
        if notes:
            self.notes = notes if not self.notes else f"{self.notes}\n\nVerification: {notes}"
    
    def flag_as_disputed(self, reason: str):
        """Flag result as disputed"""
        self.status = GameResultStatus.DISPUTED
        
        if not self.anomaly_flags:
            self.anomaly_flags = []
        
        self.anomaly_flags.append({
            "type": "dispute",
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })
    
    def calculate_xp_reward(self) -> int:
        """Calculate XP reward based on performance"""
        base_xp = {
            "GAME1": 15,
            "GAME2": 10,
            "GAME3": 20
        }.get(self.game_type, 10)
        
        # Bonus for high performance
        performance_bonus = int(self.score_percentage / 10)
        
        # Bonus for personal best
        pb_bonus = 10 if self.personal_best else 0
        
        # Bonus for improvement
        improvement_bonus = max(0, int(self.improvement_from_last * 2))
        
        return base_xp + performance_bonus + pb_bonus + improvement_bonus

# === PLAYER STATISTICS MODEL ===

class PlayerStatistics(Base):
    """
    Aggregated player statistics for performance tracking and analysis
    """
    __tablename__ = "player_statistics"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    game_type = Column(String(20), nullable=False, index=True)
    
    # Game Count Statistics
    total_games = Column(Integer, default=0)
    games_this_week = Column(Integer, default=0)
    games_this_month = Column(Integer, default=0)
    
    # Scoring Statistics
    total_score = Column(Integer, default=0)
    best_score = Column(Integer, default=0)
    worst_score = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    median_score = Column(Float, default=0.0)
    
    # Recent Performance (last 10 games)
    recent_scores = Column(JSON, default=lambda: [])
    recent_average = Column(Float, default=0.0)
    recent_trend = Column(String(20), default="stable")  # "improving", "declining", "stable"
    
    # Performance Metrics
    average_accuracy = Column(Float, default=0.0)
    average_power = Column(Float, default=0.0)
    average_speed = Column(Float, default=0.0)
    average_technique = Column(Float, default=0.0)
    average_consistency = Column(Float, default=0.0)
    
    # Skill Development
    skill_improvement_rate = Column(JSON, default=lambda: {})  # Improvement per week for each skill
    current_performance_level = Column(Enum(PerformanceLevel), default=PerformanceLevel.BEGINNER)
    
    # Achievements and Milestones
    personal_bests_count = Column(Integer, default=0)
    perfect_scores_count = Column(Integer, default=0)  # Number of perfect/near-perfect games
    improvement_streaks = Column(JSON, default=lambda: {})
    
    # Playing Patterns
    preferred_locations = Column(JSON, default=lambda: [])  # Most played locations
    playing_hours_distribution = Column(JSON, default=lambda: {})  # Hours of day preferences
    weather_performance = Column(JSON, default=lambda: {})  # Performance in different weather
    
    # Time-based Analysis
    first_game_date = Column(DateTime, nullable=True)
    last_game_date = Column(DateTime, nullable=True)
    total_playtime_minutes = Column(Integer, default=0)
    average_game_duration = Column(Float, default=0.0)
    
    # Ranking Information
    current_percentile = Column(Float, default=0.0)
    best_percentile = Column(Float, default=0.0)
    rank_among_players = Column(Integer, nullable=True)
    total_players_in_game = Column(Integer, default=1)
    
    # Progress Tracking
    weekly_progress = Column(JSON, default=lambda: [])    # Weekly progress data
    monthly_progress = Column(JSON, default=lambda: [])   # Monthly progress data
    goals_set = Column(JSON, default=lambda: [])          # Player goals
    goals_achieved = Column(JSON, default=lambda: [])     # Achieved goals
    
    # Timestamps
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    statistics_version = Column(Integer, default=1)  # For schema evolution
    
    # Relationships
    user = relationship("User", back_populates="player_statistics")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('player_id', 'game_type', name='unique_player_game_stats'),
        Index('idx_player_stats_performance', 'game_type', 'current_performance_level'),
        Index('idx_player_stats_ranking', 'game_type', 'current_percentile'),
    )
    
    def __repr__(self):
        return f"<PlayerStatistics(player_id={self.player_id}, game='{self.game_type}', avg_score={self.average_score:.1f})>"
    
    @property
    def improvement_percentage(self) -> float:
        """Calculate overall improvement percentage"""
        if len(self.recent_scores) < 2:
            return 0.0
        
        first_half = self.recent_scores[:len(self.recent_scores)//2]
        second_half = self.recent_scores[len(self.recent_scores)//2:]
        
        if not first_half or not second_half:
            return 0.0
        
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        
        if first_avg == 0:
            return 0.0
        
        return ((second_avg - first_avg) / first_avg) * 100
    
    @property
    def skill_balance_score(self) -> float:
        """Calculate how balanced the player's skills are (lower = more balanced)"""
        skills = [
            self.average_accuracy,
            self.average_power,
            self.average_speed,
            self.average_technique,
            self.average_consistency
        ]
        
        if not any(skills):
            return 0.0
        
        # Calculate standard deviation as measure of balance
        mean_skill = sum(skills) / len(skills)
        variance = sum((skill - mean_skill) ** 2 for skill in skills) / len(skills)
        return variance ** 0.5
    
    def update_from_result(self, result: GameResult):
        """Update statistics from a new game result"""
        # Update basic counts
        self.total_games += 1
        self.total_score += result.final_score
        self.total_playtime_minutes += result.game_duration_minutes
        
        # Update bests/worsts
        if result.final_score > self.best_score:
            self.best_score = result.final_score
            self.personal_bests_count += 1
        
        if self.worst_score == 0 or result.final_score < self.worst_score:
            self.worst_score = result.final_score
        
        # Update averages
        self.average_score = self.total_score / self.total_games
        self.average_game_duration = self.total_playtime_minutes / self.total_games
        
        # Update skill averages
        self._update_skill_averages(result)
        
        # Update recent scores
        if not self.recent_scores:
            self.recent_scores = []
        
        self.recent_scores.append(result.final_score)
        if len(self.recent_scores) > 10:
            self.recent_scores = self.recent_scores[-10:]
        
        self.recent_average = sum(self.recent_scores) / len(self.recent_scores)
        
        # Update trend
        self._calculate_trend()
        
        # Update dates
        if not self.first_game_date:
            self.first_game_date = result.played_at
        self.last_game_date = result.played_at
        
        # Update timestamp
        self.last_updated = datetime.now()
    
    def _update_skill_averages(self, result: GameResult):
        """Update skill averages from new result"""
        # Weighted average with more weight on recent games
        weight = 1.0 / self.total_games
        
        self.average_accuracy = ((self.average_accuracy * (1 - weight)) + 
                               (result.accuracy_score * weight))
        self.average_power = ((self.average_power * (1 - weight)) + 
                            (result.power_score * weight))
        self.average_speed = ((self.average_speed * (1 - weight)) + 
                            (result.speed_score * weight))
        self.average_technique = ((self.average_technique * (1 - weight)) + 
                                (result.technique_score * weight))
        self.average_consistency = ((self.average_consistency * (1 - weight)) + 
                                  (result.consistency_score * weight))
    
    def _calculate_trend(self):
        """Calculate recent performance trend"""
        if len(self.recent_scores) < 3:
            self.recent_trend = "stable"
            return
        
        # Simple trend calculation based on first half vs second half
        mid_point = len(self.recent_scores) // 2
        first_half_avg = sum(self.recent_scores[:mid_point]) / mid_point
        second_half_avg = sum(self.recent_scores[mid_point:]) / (len(self.recent_scores) - mid_point)
        
        improvement = (second_half_avg - first_half_avg) / first_half_avg * 100
        
        if improvement > 5:
            self.recent_trend = "improving"
        elif improvement < -5:
            self.recent_trend = "declining"
        else:
            self.recent_trend = "stable"

# === LEADERBOARD MODEL ===

class Leaderboard(Base):
    """
    Leaderboard entries for different game types and time periods
    """
    __tablename__ = "leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    leaderboard_type = Column(String(50), nullable=False, index=True)  # "daily", "weekly", "monthly", "all_time"
    game_type = Column(String(20), nullable=False, index=True)
    
    # Player Information
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    player_username = Column(String(50), nullable=False)  # Denormalized
    player_level = Column(Integer, nullable=False)
    
    # Ranking Information
    rank_position = Column(Integer, nullable=False, index=True)
    score = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    
    # Performance Details
    games_played = Column(Integer, nullable=False)
    average_score = Column(Float, nullable=False)
    best_score = Column(Integer, nullable=False)
    consistency_rating = Column(Float, default=0.0)  # How consistent the player is
    
    # Time Period
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False, index=True)
    
    # Additional Stats
    total_playtime_minutes = Column(Integer, default=0)
    improvement_rate = Column(Float, default=0.0)  # % improvement during period
    streak_count = Column(Integer, default=0)      # Current improvement streak
    
    # Achievements during period
    personal_bests = Column(Integer, default=0)
    perfect_games = Column(Integer, default=0)
    
    # Metadata
    qualification_met = Column(Boolean, default=True)  # Meets minimum games requirement
    min_games_required = Column(Integer, default=5)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="leaderboard_entries")
    
    # Indexes and constraints
    __table_args__ = (
        UniqueConstraint('leaderboard_type', 'game_type', 'player_id', 'period_start', 
                        name='unique_leaderboard_entry'),
        Index('idx_leaderboard_ranking', 'leaderboard_type', 'game_type', 'rank_position'),
        Index('idx_leaderboard_score', 'leaderboard_type', 'game_type', 'score'),
        Index('idx_leaderboard_period', 'period_start', 'period_end'),
    )
    
    def __repr__(self):
        return f"<Leaderboard(type='{self.leaderboard_type}', game='{self.game_type}', rank={self.rank_position}, player='{self.player_username}')>"
    
    @property
    def is_current_period(self) -> bool:
        """Check if leaderboard entry is for current period"""
        now = datetime.now()
        return self.period_start <= now <= self.period_end
    
    @property
    def percentile_rank(self) -> float:
        """Calculate percentile rank (would need total entries)"""
        # This would be calculated based on total entries in leaderboard
        # For now, return a mock calculation
        return max(0, 100 - (self.rank_position / 100 * 100))
    
    @property
    def performance_badge(self) -> str:
        """Get performance badge based on rank"""
        if self.rank_position == 1:
            return "🥇"
        elif self.rank_position == 2:
            return "🥈"
        elif self.rank_position == 3:
            return "🥉"
        elif self.rank_position <= 10:
            return "🏆"
        elif self.rank_position <= 50:
            return "⭐"
        else:
            return "📈"
    
    def calculate_points(self) -> int:
        """Calculate leaderboard points based on performance"""
        base_points = max(0, 1000 - (self.rank_position - 1) * 10)
        consistency_bonus = int(self.consistency_rating * 10)
        improvement_bonus = int(self.improvement_rate * 5)
        
        return base_points + consistency_bonus + improvement_bonus

# === PYDANTIC SCHEMAS ===

class GameResultCreate(BaseModel):
    """Schema for creating a new game result"""
    game_type: str
    player_id: int
    location_id: int
    final_score: int
    game_duration_minutes: int
    detailed_results: Dict[str, Any]
    notes: Optional[str] = None

class GameResultResponse(BaseModel):
    """Schema for game result response"""
    id: int
    result_id: str
    game_type: str
    player_username: str
    final_score: int
    score_percentage: float
    performance_level: PerformanceLevel
    personal_best: bool
    played_at: datetime
    status: GameResultStatus
    
    class Config:
        from_attributes = True

class PlayerStatsResponse(BaseModel):
    """Schema for player statistics response"""
    player_id: int
    game_type: str
    total_games: int
    average_score: float
    best_score: int
    current_performance_level: PerformanceLevel
    recent_trend: str
    skill_scores: Dict[str, float]
    
    class Config:
        from_attributes = True

class LeaderboardResponse(BaseModel):
    """Schema for leaderboard response"""
    leaderboard_type: str
    game_type: str
    entries: List[Dict[str, Any]]
    total_entries: int
    last_updated: datetime
    
    class Config:
        from_attributes = True