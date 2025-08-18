# === backend/app/models/__init__.py ===
# JAVÍTOTT - MODERATION MODELS IDEIGLENESEN LETILTVA

# KRITIKUS: Először a Base-t és primary modelleket
from .user import User, UserSession

# BIZTONSÁGOS: Csak azokat importáljuk, amik biztosan léteznek
try:
    from .location import Location, GameDefinition, GameSession, LocationType, GameSessionStatus
    LOCATION_MODELS_AVAILABLE = True
    print("✅ Location models imported successfully")
except ImportError as e:
    LOCATION_MODELS_AVAILABLE = False
    print(f"⚠️ Location models not available: {e}")

try:
    from .tournament import Tournament, TournamentParticipant
    TOURNAMENT_MODELS_AVAILABLE = True
    print("✅ Tournament models imported successfully")
except ImportError as e:
    TOURNAMENT_MODELS_AVAILABLE = False
    print(f"⚠️ Tournament models not available: {e}")

# ⚠️ WEATHER MODELS TEMPORARILY DISABLED
WEATHER_MODELS_AVAILABLE = False
print("⚠️ Weather models temporarily disabled for stability")

try:
    from .game_results import GameResult
    GAME_RESULTS_AVAILABLE = True
    print("✅ Game Results models imported successfully")
except ImportError as e:
    GAME_RESULTS_AVAILABLE = False
    print(f"⚠️ Game Results models not available: {e}")

# 🔥 MODERATION MODELS TEMPORARILY DISABLED TO FIX RELATIONSHIPS
MODERATION_MODELS_AVAILABLE = False
print("🔥 Moderation models temporarily disabled to fix relationship conflicts")

# ✅ JAVÍTOTT: Social models import nevek
try:
    from .friends import Friendship, FriendRequest, Challenge, UserBlock
    SOCIAL_MODELS_AVAILABLE = True
    print("✅ Social models imported successfully")
except ImportError as e:
    SOCIAL_MODELS_AVAILABLE = False
    print(f"⚠️ Social models not available: {e}")

try:
    from .coupon import Coupon, CouponUsage
    COUPON_MODELS_AVAILABLE = True
    print("✅ Coupon models imported successfully")
except ImportError as e:
    COUPON_MODELS_AVAILABLE = False
    print(f"⚠️ Coupon models not available: {e}")

# Alapvető export lista
__all__ = [
    "User",
    "UserSession"
]

# Feltételes exportok
if LOCATION_MODELS_AVAILABLE:
    __all__.extend([
        "Location",
        "GameDefinition", 
        "GameSession",
        "LocationType",
        "GameSessionStatus"
    ])

if TOURNAMENT_MODELS_AVAILABLE:
    __all__.extend([
        "Tournament",
        "TournamentParticipant"
    ])

if GAME_RESULTS_AVAILABLE:
    __all__.extend([
        "GameResult"
    ])

# MODERATION MODELS KIHAGYVA
# if MODERATION_MODELS_AVAILABLE:
#     __all__.extend([
#         "UserViolation",
#         "ModerationLog", 
#         "UserReport"
#     ])

if SOCIAL_MODELS_AVAILABLE:
    __all__.extend([
        "Friendship",
        "FriendRequest",
        "Challenge", 
        "UserBlock"
    ])

if COUPON_MODELS_AVAILABLE:
    __all__.extend([
        "Coupon",
        "CouponUsage"
    ])

# Modell csoportok státusza
available_groups = []
unavailable_groups = []

if LOCATION_MODELS_AVAILABLE:
    available_groups.append("locations")
else:
    unavailable_groups.append("locations")

if TOURNAMENT_MODELS_AVAILABLE:
    available_groups.append("tournaments")
else:
    unavailable_groups.append("tournaments")

# Weather explicitly disabled
unavailable_groups.append("weather")

if GAME_RESULTS_AVAILABLE:
    available_groups.append("game_results")
else:
    unavailable_groups.append("game_results")

# Moderation explicitly disabled for now
unavailable_groups.append("moderation")

if SOCIAL_MODELS_AVAILABLE:
    available_groups.append("social")
else:
    unavailable_groups.append("social")

if COUPON_MODELS_AVAILABLE:
    available_groups.append("coupons")
else:
    unavailable_groups.append("coupons")

print(f"✅ Available model groups: {', '.join(available_groups)}")
if unavailable_groups:
    print(f"⚠️ Unavailable model groups: {', '.join(unavailable_groups)}")

print(f"✅ Total models loaded: {len(__all__)}")
print(f"✅ Exported models: {', '.join(__all__)}")

print("✅ Successfully imported: User, UserSession, Location, GameDefinition, GameSession, Tournament models, Social models, Coupon models")