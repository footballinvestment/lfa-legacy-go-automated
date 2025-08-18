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
    
    # Participation Settings
    min_participants = Column(Integer, default=4)
    max_participants = Column(Integer, default=16)
    current_participants = Column(Integer, default=0)
    
    # Financial Configuration
    entry_fee_credits = Column(Integer, default=0)
    prize_pool_credits = Column(Integer, default=0)
    prize_distribution = Column(JSON, default=lambda: {"1st": 50, "2nd": 30, "3rd": 20})
    
    # Level and Skill Requirements
    min_level = Column(Integer, default=1)
    max_level = Column(Integer, nullable=True)
    skill_requirements = Column(JSON, default=dict)
    
    # Tournament Status and Management
    status = Column(Enum(TournamentStatus), default=TournamentStatus.DRAFT)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    moderator_ids = Column(JSON, default=list)
    
    # Tournament Results
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    runner_up_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    third_place_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Tournament Structure and Progress
    current_round = Column(Integer, default=0)
    total_rounds = Column(Integer, default=1)
    bracket_data = Column(JSON, default=dict)
    schedule = Column(JSON, default=dict)
    
    # Tournament Rules and Configuration
    rules = Column(JSON, default=dict)
    special_rules = Column(Text, nullable=True)
    match_duration_minutes = Column(Integer, default=30)
    break_duration_minutes = Column(Integer, default=10)
    
    # Analytics and Statistics
    total_matches = Column(Integer, default=0)
    completed_matches = Column(Integer, default=0)
    average_match_duration = Column(Float, default=0.0)
    competitiveness_score = Column(Float, default=0.0)
    
    # Tournament Quality and Engagement
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    spectator_count = Column(Integer, default=0)
    total_prize_awarded = Column(Integer, default=0)
    
    # Media and Promotion
    banner_image_url = Column(String(255), nullable=True)
    promotion_text = Column(Text, nullable=True)
    hashtags = Column(JSON, default=list)
    social_links = Column(JSON, default=dict)
    
    # Tournament Metadata
    is_featured = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    is_recurring = Column(Boolean, default=False)
    recurring_schedule = Column(JSON, default=dict)
    
    # Weather and Environmental Factors
    weather_dependent = Column(Boolean, default=True)
    backup_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    weather_requirements = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # ✅ JAVÍTOTT: Relationships with explicit foreign_keys
    location = relationship("Location", foreign_keys=[location_id], back_populates="tournaments")
    backup_location = relationship("Location", foreign_keys=[backup_location_id])
    participants = relationship("TournamentParticipant", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("TournamentMatch", back_populates="tournament", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tournament(id='{self.tournament_id}', name='{self.name}', status='{self.status.value}')>"

    @property
    def is_registration_open(self) -> bool:
        """Check if registration is currently open"""
        now = datetime.utcnow()
        return (
            self.status == TournamentStatus.REGISTRATION and
            now < self.registration_deadline and
            self.current_participants < self.max_participants
        )

    @property
    def is_full(self) -> bool:
        """Check if tournament is at capacity"""
        return self.current_participants >= self.max_participants

    @property
    def can_start(self) -> bool:
        """Check if tournament can start"""
        return (
            self.current_participants >= self.min_participants and
            self.status in [TournamentStatus.REGISTRATION, TournamentStatus.REGISTRATION_CLOSED] and
            datetime.utcnow() >= self.start_time
        )

    @property
    def completion_percentage(self) -> float:
        """Calculate tournament completion percentage"""
        if self.total_matches == 0:
            return 0.0
        return (self.completed_matches / self.total_matches) * 100

    def add_participant(self, user_id: int) -> bool:
        """Add a participant to the tournament"""
        if not self.is_registration_open:
            return False
        
        # Check if user is already registered
        existing = any(p.user_id == user_id for p in self.participants)
        if existing:
            return False
        
        self.current_participants += 1
        return True

    def remove_participant(self, user_id: int) -> bool:
        """Remove a participant from the tournament"""
        if self.status not in [TournamentStatus.REGISTRATION]:
            return False
        
        # Find and remove participant
        for participant in self.participants:
            if participant.user_id == user_id:
                self.current_participants -= 1
                return True
        return False

    def generate_bracket(self) -> Dict:
        """Generate tournament bracket based on format"""
        if self.format == TournamentFormat.SINGLE_ELIMINATION:
            return self._generate_single_elimination_bracket()
        elif self.format == TournamentFormat.ROUND_ROBIN:
            return self._generate_round_robin_schedule()
        # Add more formats as needed
        return {}

    def _generate_single_elimination_bracket(self) -> Dict:
        """Generate single elimination bracket"""
        participants = list(self.participants)
        participant_count = len(participants)
        
        # Calculate rounds needed
        rounds_needed = math.ceil(math.log2(participant_count))
        self.total_rounds = rounds_needed
        
        bracket = {
            "format": "single_elimination",
            "total_rounds": rounds_needed,
            "total_matches": participant_count - 1,
            "rounds": {}
        }
        
        # Generate first round matches
        first_round_matches = []
        for i in range(0, participant_count, 2):
            match = {
                "match_id": f"{self.tournament_id}_r1_m{i//2+1}",
                "round": 1,
                "player1": participants[i].user_id if i < participant_count else None,
                "player2": participants[i+1].user_id if i+1 < participant_count else None,
                "winner": None,
                "completed": False
            }
            first_round_matches.append(match)
        
        bracket["rounds"]["1"] = {"matches": first_round_matches}
        
        return bracket

    def _generate_round_robin_schedule(self) -> Dict:
        """Generate round robin schedule"""
        participants = list(self.participants)
        participant_count = len(participants)
        
        total_matches = (participant_count * (participant_count - 1)) // 2
        
        schedule = {
            "format": "round_robin",
            "total_rounds": participant_count - 1,
            "total_matches": total_matches,
            "matches": []
        }
        
        match_id = 1
        for i in range(participant_count):
            for j in range(i + 1, participant_count):
                match = {
                    "match_id": f"{self.tournament_id}_rr_m{match_id}",
                    "player1": participants[i].user_id,
                    "player2": participants[j].user_id,
                    "winner": None,
                    "completed": False
                }
                schedule["matches"].append(match)
                match_id += 1
        
        return schedule

    def update_match_result(self, match_id: str, winner_id: int):
        """Update match result in bracket"""
        if not self.bracket_data:
            return
        
        # Find and update match in bracket
        for round_num, round_data in self.bracket_data.get("rounds", {}).items():
            for match in round_data.get("matches", []):
                if match.get("match_id") == match_id:
                    match["winner"] = winner_id
                    match["completed"] = True
                    break

# === TOURNAMENT PARTICIPANT MODEL ===

class TournamentParticipant(Base):
    """
    Tournament participant tracking with detailed statistics
    """
    __tablename__ = "tournament_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Registration Information
    registration_time = Column(DateTime(timezone=True), server_default=func.now())
    registration_ip = Column(String(45), nullable=True)
    registration_method = Column(String(20), default="manual")
    
    # Participant Status
    status = Column(Enum(ParticipantStatus), default=ParticipantStatus.REGISTERED)
    seeding = Column(Integer, nullable=True)
    bracket_position = Column(String(20), nullable=True)
    
    # Performance Statistics
    matches_played = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    matches_lost = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    best_score = Column(Integer, default=0)
    
    # Tournament Progression
    current_round = Column(Integer, default=0)
    eliminated_in_round = Column(Integer, nullable=True)
    final_placement = Column(Integer, nullable=True)
    advancement_path = Column(JSON, default=list)
    
    # Performance Metrics
    performance_rating = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    clutch_performance = Column(Float, default=0.0)
    improvement_rate = Column(Float, default=0.0)
    
    # Rewards and Recognition
    prize_won = Column(Integer, default=0)
    achievements_earned = Column(JSON, default=list)
    special_recognitions = Column(JSON, default=list)
    
    # Participant Behavior
    punctuality_score = Column(Float, default=100.0)
    sportsmanship_rating = Column(Float, default=5.0)
    fair_play_violations = Column(Integer, default=0)
    
    # Additional Data
    participant_notes = Column(Text, nullable=True)
    coaching_notes = Column(Text, nullable=True)
    equipment_used = Column(JSON, default=dict)
    
    # Timestamps
    eliminated_at = Column(DateTime, nullable=True)
    final_match_time = Column(DateTime, nullable=True)
    
    # ✅ JAVÍTOTT: Relationships
    tournament = relationship("Tournament", back_populates="participants")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_participant'),
    )
    
    def __repr__(self):
        return f"<TournamentParticipant(tournament={self.tournament_id}, user={self.user_id}, status='{self.status.value}')>"

    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage"""
        if self.matches_played == 0:
            return 0.0
        return (self.matches_won / self.matches_played) * 100

    @property
    def is_active(self) -> bool:
        """Check if participant is still active in tournament"""
        return self.status in [ParticipantStatus.REGISTERED, ParticipantStatus.CONFIRMED]

    @property
    def is_eliminated(self) -> bool:
        """Check if participant has been eliminated"""
        return self.eliminated_in_round is not None

    def add_match_result(self, won: bool, score: int):
        """Add a match result to participant statistics"""
        self.matches_played += 1
        if won:
            self.matches_won += 1
        else:
            self.matches_lost += 1
        
        self.total_score += score
        
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
    
    # ✅ JAVÍTOTT: Relationships
    tournament = relationship("Tournament", back_populates="matches")
    
    def __repr__(self):
        return f"<TournamentMatch(id='{self.match_id}', tournament={self.tournament_id}, round={self.round_number})>"
    
    @property
    def is_completed(self) -> bool:
        """Check if match is completed"""
        return self.status == MatchStatus.COMPLETED and self.winner_id is not None
    
    @property
    def is_bye(self) -> bool:
        """Check if this is a bye match"""
        return self.player2_id is None
    
    def complete_match(self, winner_id: int, player1_score: int, player2_score: int = None):
        """Complete the match with results"""
        self.winner_id = winner_id
        self.player1_score = player1_score
        if player2_score is not None:
            self.player2_score = player2_score
        self.status = MatchStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        
        if self.actual_start_time:
            duration = datetime.utcnow() - self.actual_start_time
            self.duration_minutes = int(duration.total_seconds() / 60)

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
    achievement = relationship("TournamentAchievement")
    tournament = relationship("Tournament")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('user_id', 'achievement_id', name='unique_user_achievement'),
    )
    
    def __repr__(self):
        return f"<UserTournamentAchievement(user={self.user_id}, achievement='{self.achievement_id}')>"