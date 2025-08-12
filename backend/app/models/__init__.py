# app/models/__init__.py
"""
LFA Legacy GO - Models Package
Imports all database models to ensure they are created
"""

# Import all models to ensure they are registered with SQLAlchemy
from .user import User, UserSession
from .friends import FriendRequest, Friendship, Challenge, UserBlock
from .location import Location, GameDefinition, GameSession
from .tournament import (
    Tournament, TournamentParticipant, TournamentMatch, TournamentBracket,
    TournamentAchievement, UserTournamentAchievement,
    TournamentType, TournamentFormat, TournamentStatus, ParticipantStatus, MatchStatus
)
from .weather import (
    LocationWeather, WeatherForecast, WeatherAlert, GameWeatherSuitability,
    WeatherCondition, WeatherSeverity
)

# === NEW: Game Results Models ===
from .game_results import (
    GameResult, PlayerStatistics, Leaderboard,
    GameResultStatus, PerformanceLevel, SkillCategory
)

__all__ = [
    # User models
    "User", 
    "UserSession",
    
    # Social models
    "FriendRequest", 
    "Friendship", 
    "Challenge", 
    "UserBlock",
    
    # Location and booking models
    "Location",
    "GameDefinition", 
    "GameSession",
    
    # Tournament models
    "Tournament",
    "TournamentParticipant",
    "TournamentMatch", 
    "TournamentBracket",
    "TournamentAchievement",
    "UserTournamentAchievement",
    "TournamentType",
    "TournamentFormat", 
    "TournamentStatus",
    "ParticipantStatus",
    "MatchStatus",
    
    # Weather models
    "LocationWeather",
    "WeatherForecast",
    "WeatherAlert",
    "GameWeatherSuitability",
    "WeatherCondition",
    "WeatherSeverity",
    
    # === NEW: Game Results Models ===
    "GameResult",
    "PlayerStatistics", 
    "Leaderboard",
    "GameResultStatus",
    "PerformanceLevel",
    "SkillCategory"
]