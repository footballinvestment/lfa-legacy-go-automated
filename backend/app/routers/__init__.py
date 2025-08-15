# backend/app/routers/__init__.py
# TELJES JAVÍTOTT FÁJL - Router exports

# Import all routers with error handling
try:
    from . import auth
    print("✅ Auth router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import auth router: {e}")
    auth = None

try:
    from . import credits
    print("✅ Credits router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import credits router: {e}")
    credits = None

try:
    from . import social
    print("✅ Social router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import social router: {e}")
    social = None

try:
    from . import locations
    print("✅ Locations router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import locations router: {e}")
    locations = None

try:
    from . import booking
    print("✅ Booking router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import booking router: {e}")
    booking = None

try:
    from . import tournaments
    print("✅ Tournaments router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import tournaments router: {e}")
    tournaments = None

try:
    from . import weather
    print("✅ Weather router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import weather router: {e}")
    weather = None

try:
    from . import game_results
    print("✅ Game Results router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import game_results router: {e}")
    game_results = None

try:
    from . import admin
    print("✅ Admin router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import admin router: {e}")
    admin = None

try:
    from . import health
    print("✅ Health router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import health router: {e}")
    health = None

# Export all successfully imported routers
__all__ = []

if auth is not None:
    __all__.append("auth")
if credits is not None:
    __all__.append("credits")
if social is not None:
    __all__.append("social")
if locations is not None:
    __all__.append("locations")
if booking is not None:
    __all__.append("booking")
if tournaments is not None:
    __all__.append("tournaments")
if weather is not None:
    __all__.append("weather")
if game_results is not None:
    __all__.append("game_results")
if admin is not None:
    __all__.append("admin")
if health is not None:
    __all__.append("health")

print(f"🚀 Successfully imported {len(__all__)} routers: {', '.join(__all__)}")