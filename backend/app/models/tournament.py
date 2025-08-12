# === backend/app/models/tournament.py ===
# Complete Tournament System Models - JAVÍTOTT VERZIÓ SQLAlchemy warnings nélkül

from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Float, ForeignKey, Text, Enum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database import Base
from typing import Optional, List, Dict, Tuple
from enum import Enum as PyEnum
import uuid
import math

# === TOURNAMENT ENUMS ===

class TournamentType(str, PyEnum):
    DAILY_CHALLENGE = "daily_challenge"
    WEEKLY_CUP = "weekly_cup"
    MONTHLY_CHAMPIONSHIP = "monthly_championship"
    SPECIAL_EVENT = "special_event"
    LEAGUE_SEASON = "league_season"

class TournamentFormat(str, PyEnum):
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS_SYSTEM = "swiss_system"
    LEAGUE = "league"

class TournamentStatus(str, PyEnum):
    DRAFT = "draft"
    REGISTRATION = "registration"
    REGISTRATION_CLOSED = "registration_closed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ParticipantStatus(str, PyEnum):
    REGISTERED = "registered"
    CONFIRMED = "confirmed"
    WITHDREW = "withdrew"
    DISQUALIFIED = "disqualified"
    NO_SHOW = "no_show"

class MatchStatus(str, PyEnum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    WALKOVER = "walkover"

# === MAIN TOURNAMENT MODEL ===

class Tournament(Base):
    """
    Main tournament model with comprehensive tournament management
    """
    __tablename__ = "tournaments"
    
    # Primary identification
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Tournament Configuration
    tournament_type = Column(Enum(TournamentType), nullable=False)
    game_type = Column(String(10), nullable=False)
    format = Column(Enum(TournamentFormat), nullable=False)
    
    # Location and Timing
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    
    # Participation Rules
    min_participants = Column(Integer, default=4)
    max_participants = Column(Integer, nullable=False)
    min_level = Column(Integer, default=1)
    max_level = Column(Integer, nullable=True)
    
    # Entry Requirements
    entry_fee_credits = Column(Integer, default=0)
    entry_requirements = Column(JSON, default=lambda: {})
    
    # Prize Pool
    prize_pool_credits = Column(Integer, default=0)
    prize_distribution = Column(JSON, nullable=False)
    
    # Status and Management
    status = Column(Enum(TournamentStatus), default=TournamentStatus.REGISTRATION)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Tournament Settings
    settings = Column(JSON, default=lambda: {})
    
    # Results
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    final_standings = Column(JSON, default=lambda: [])
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # === RELATIONSHIPS - JAVÍTOTT VERZIÓ overlaps paraméterekkel ===
    location = relationship("Location", back_populates="tournaments")
    organizer = relationship("User", foreign_keys=[organizer_id], overlaps="organized_tournaments")
    winner = relationship("User", foreign_keys=[winner_id], overlaps="won_tournaments")
    participants = relationship("TournamentParticipant", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("TournamentMatch", back_populates="tournament", cascade="all, delete-orphan")
    bracket = relationship("TournamentBracket", back_populates="tournament", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tournament(id='{self.tournament_id}', name='{self.name}', status='{self.status.value}')>"
    
    @property
    def is_registration_open(self) -> bool:
        """Check if tournament registration is still open"""
        return (self.status == TournamentStatus.REGISTRATION and 
                datetime.now() < self.registration_deadline)
    
    @property
    def participant_count(self) -> int:
        """Get current number of participants"""
        return len([p for p in self.participants if p.status not in [ParticipantStatus.WITHDREW, ParticipantStatus.DISQUALIFIED]])
    
    @property
    def is_full(self) -> bool:
        """Check if tournament is at maximum capacity"""
        return self.participant_count >= self.max_participants
    
    @property
    def can_start(self) -> bool:
        """Check if tournament can be started"""
        return (self.status == TournamentStatus.REGISTRATION_CLOSED and 
                self.participant_count >= self.min_participants)
    
    def generate_tournament_id(self) -> str:
        """Generate unique tournament ID"""
        date_str = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4().hex[:6]).upper()
        return f"TOURN_{date_str}_{random_suffix}"
    
    def calculate_total_matches(self) -> int:
        """Calculate total number of matches for this tournament format"""
        participant_count = self.participant_count
        
        if self.format == TournamentFormat.SINGLE_ELIMINATION:
            return participant_count - 1
        elif self.format == TournamentFormat.ROUND_ROBIN:
            return participant_count * (participant_count - 1) // 2
        elif self.format == TournamentFormat.SWISS_SYSTEM:
            rounds = math.ceil(math.log2(participant_count))
            return rounds * (participant_count // 2)
        else:
            return 0
    
    def calculate_estimated_duration(self) -> timedelta:
        """Calculate estimated tournament duration"""
        game_duration = 20
        setup_time = 5
        
        total_matches = self.calculate_total_matches()
        
        if self.format == TournamentFormat.SINGLE_ELIMINATION:
            rounds = math.ceil(math.log2(self.participant_count))
            duration_minutes = rounds * (game_duration + setup_time)
        elif self.format == TournamentFormat.ROUND_ROBIN:
            duration_minutes = total_matches * (game_duration + setup_time)
        else:
            duration_minutes = total_matches * (game_duration + setup_time) // 2
        
        return timedelta(minutes=duration_minutes)

# === TOURNAMENT PARTICIPANT MODEL ===

class TournamentParticipant(Base):
    """
    Tournament participant with detailed tracking
    """
    __tablename__ = "tournament_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Registration
    registration_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(ParticipantStatus), default=ParticipantStatus.REGISTERED)
    
    # 🔧 JAVÍTÁS: HIÁNYZÓ FIELDS HOZZÁADÁSA
    entry_fee_paid = Column(Integer, default=0)
    withdrawal_time = Column(DateTime, nullable=True)
    
    # Tournament Progress
    current_round = Column(Integer, default=0)
    matches_played = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    matches_lost = Column(Integer, default=0)
    matches_drawn = Column(Integer, default=0)
    
    # Scoring Statistics
    total_score = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    best_score = Column(Integer, default=0)
    
    # Swiss System specific
    points = Column(Float, default=0.0)
    tie_break_score = Column(Float, default=0.0)
    
    # Final Results
    final_position = Column(Integer, nullable=True)
    prize_won = Column(Integer, default=0)
    
    # Performance Metrics
    performance_rating = Column(Float, default=0.0)
    skill_rating_change = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_participation'),
    )
    
    def __repr__(self):
        return f"<TournamentParticipant(tournament={self.tournament_id}, user={self.user_id}, status='{self.status.value}')>"
    
    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage"""
        total_games = self.matches_played
        if total_games == 0:
            return 0.0
        return (self.matches_won / total_games) * 100
    
    @property
    def points_per_game(self) -> float:
        """Calculate average points per game"""
        if self.matches_played == 0:
            return 0.0
        return self.total_score / self.matches_played
    
    def update_match_statistics(self, won: bool, score: int, opponent_score: int):
        """Update participant statistics after a match"""
        self.matches_played += 1
        self.total_score += score
        
        if won:
            self.matches_won += 1
            self.points += 1.0
        elif score == opponent_score:
            self.matches_drawn += 1
            self.points += 0.5
        else:
            self.matches_lost += 1
        
        # Update averages
        self.average_score = self.total_score / self.matches_played
        if score > self.best_score:
            self.best_score = score

# === TOURNAMENT MATCH MODEL ===

class TournamentMatch(Base):
    """
    Individual tournament match with complete tracking
    """
    __tablename__ = "tournament_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(String(50), unique=True, index=True, nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    
    # Match Structure
    round_number = Column(Integer, nullable=False)
    match_number = Column(Integer, nullable=False)
    bracket_position = Column(String(20), nullable=True)
    
    # Participants
    player1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Game Session Integration
    game_session_id = Column(String(50), ForeignKey("game_sessions.session_id"), nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    
    # Results
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    player1_score = Column(Integer, nullable=True)
    player2_score = Column(Integer, nullable=True)
    is_bye = Column(Boolean, default=False)
    
    # Additional match data
    match_data = Column(JSON, default=lambda: {})
    match_notes = Column(Text, nullable=True)
    
    # Performance Metrics
    duration_minutes = Column(Integer, nullable=True)
    competitiveness_score = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("User", foreign_keys=[player1_id])
    player2 = relationship("User", foreign_keys=[player2_id])
    winner = relationship("User", foreign_keys=[winner_id])
    
    def __repr__(self):
        return f"<TournamentMatch(id='{self.match_id}', tournament={self.tournament_id}, round={self.round_number})>"
    
    @property
    def is_completed(self) -> bool:
        """Check if match is completed"""
        return self.status == MatchStatus.COMPLETED
    
    @property
    def can_be_played(self) -> bool:
        """Check if match can be played"""
        return self.status == MatchStatus.SCHEDULED and datetime.now() >= self.scheduled_time
    
    def generate_match_id(self) -> str:
        """Generate unique match ID"""
        date_str = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4().hex[:4]).upper()
        return f"MATCH_{date_str}_{self.tournament_id}_{self.round_number}_{random_suffix}"

# === TOURNAMENT BRACKET MODEL ===

class TournamentBracket(Base):
    """
    Tournament bracket structure and management
    """
    __tablename__ = "tournament_brackets"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    
    # Bracket Configuration
    format = Column(Enum(TournamentFormat), nullable=False)
    structure = Column(JSON, nullable=False)
    
    # Bracket State
    current_round = Column(Integer, default=1)
    total_rounds = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    
    # Bracket Data
    participants_seeding = Column(JSON, default=lambda: [])
    round_results = Column(JSON, default=lambda: {})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tournament = relationship("Tournament", back_populates="bracket")
    
    def __repr__(self):
        return f"<TournamentBracket(tournament={self.tournament_id}, format='{self.format.value}', round={self.current_round}/{self.total_rounds})>"
    
    @property
    def completion_percentage(self) -> float:
        """Calculate bracket completion percentage"""
        if self.total_rounds == 0:
            return 0.0
        return (self.current_round / self.total_rounds) * 100
    
    def advance_round(self):
        """Advance bracket to next round"""
        if self.current_round < self.total_rounds:
            self.current_round += 1
        
        if self.current_round >= self.total_rounds:
            self.is_completed = True
    
    def update_match_result(self, match_id: str, winner_id: int):
        """Update bracket with match result"""
        # Find and update the match in the structure
        for round_num, round_matches in self.structure.get("rounds", {}).items():
            for match in round_matches.get("matches", []):
                if match.get("match_id") == match_id:
                    match["winner"] = winner_id
                    match["completed"] = True
                    break

# === TOURNAMENT ACHIEVEMENT MODEL ===

class TournamentAchievement(Base):
    """
    Tournament-specific achievements and milestones
    """
    __tablename__ = "tournament_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    achievement_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Achievement Details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    
    # Requirements
    requirements = Column(JSON, nullable=False)
    reward_credits = Column(Integer, default=0)
    reward_xp = Column(Integer, default=0)
    
    # Achievement Metadata
    icon_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    rarity = Column(String(20), default="common")
    
    # Statistics
    total_earned = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<TournamentAchievement(id='{self.achievement_id}', name='{self.name}')>"

class UserTournamentAchievement(Base):
    """
    User's earned tournament achievements
    """
    __tablename__ = "user_tournament_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(String(50), ForeignKey("tournament_achievements.achievement_id"), nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    
    # Achievement Details
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    progress_data = Column(JSON, default=lambda: {})
    
    # Relationships
    user = relationship("User")
    achievement = relationship("TournamentAchievement")
    tournament = relationship("Tournament")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('user_id', 'achievement_id', name='unique_user_achievement'),
    )
    
    def __repr__(self):
        return f"<UserTournamentAchievement(user={self.user_id}, achievement='{self.achievement_id}')>"