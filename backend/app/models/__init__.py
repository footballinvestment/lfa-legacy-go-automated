# backend/app/models/__init__.py
# BIZTONSÁGOS IMPORT - Csak létező modellek

# KRITIKUS: Először a Base-t és primary modelleket
from .user import User, UserSession

# BIZTONSÁGOS: Csak azokat importáljuk, amik biztosan léteznek

try:
    from .location import Location, GameDefinition
except ImportError:
    pass

try:
    from .tournament import Tournament, TournamentParticipant
except ImportError:
    pass

try:
    from .weather import WeatherData, WeatherRule, LocationWeather
except ImportError:
    pass

try:
    from .game_results import GameResult
except ImportError:
    pass

# VÉGÜL a moderation modellek (amelyek szintén User-t referencálnak)
from .moderation import UserViolation, ModerationLog, UserReport

# Export csak az elérhető modelleket
__all__ = [
    # Core User Models (mindig léteznek)
    "User",
    "UserSession", 
    
    # Moderation Models (most létrehozva)
    "UserViolation",
    "ModerationLog",
    "UserReport"
]

# Dinamikusan hozzáadjuk a további modelleket, ha léteznek
try:
    from .location import Location, GameDefinition
    __all__.extend(["Location", "GameDefinition"])
except ImportError:
    pass

try:
    from .tournament import Tournament, TournamentParticipant
    __all__.extend(["Tournament", "TournamentParticipant"])
except ImportError:
    pass

try:
    from .weather import WeatherData, WeatherRule, LocationWeather
    __all__.extend(["WeatherData", "WeatherRule", "LocationWeather"])
except ImportError:
    pass

try:
    from .game_results import GameResult
    __all__.extend(["GameResult"])
except ImportError:
    pass

# Opcionális social models
try:
    from .friends import Friendship, FriendRequest, Challenge, UserBlock
    __all__.extend(["Friendship", "FriendRequest", "Challenge", "UserBlock"])
except ImportError:
    # Ha nincs friends.py vagy hiányoznak a modellek
    pass

# Import GameSession after all core models are loaded
try:
    from .location import GameSession
    __all__.append("GameSession")
except ImportError:
    pass