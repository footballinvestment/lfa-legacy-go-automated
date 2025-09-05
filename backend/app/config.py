import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # KÉNYSZERÍTETT POSTGRESQL KONFIGURÁCIÓ
    database_url: str = "postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@/lfa_legacy_go?host=/cloudsql/lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"
    
    # Ha környezeti változó van, azt használjuk
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Cloud SQL környezetben
        if os.getenv("GOOGLE_CLOUD_PROJECT"):
            self.database_url = "postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@/lfa_legacy_go?host=/cloudsql/lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"
        
        # Környezeti változó override
        if os.getenv("DATABASE_URL"):
            self.database_url = os.getenv("DATABASE_URL")
            
        print(f"🔗 Using database: {self.database_url[:50]}...")
    
    jwt_secret_key: str = "lfa-legacy-go-production-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

settings = Settings()
