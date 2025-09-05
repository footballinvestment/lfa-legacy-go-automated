#!/bin/bash

echo "🔥 POSTGRESQL KÉNYSZERÍTÉS - MOST!"
echo "=================================="

# 1. BACKEND KÓD MÓDOSÍTÁSA - PostgreSQL kényszerítés
echo "🔧 Backend kód módosítása..."

cd backend

# Módosítsuk a database config fájlt
cat > app/config.py << 'EOF'
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
EOF

echo "✅ Backend config módosítva - PostgreSQL kényszerítve"

# 2. EGYSZERŰ DEPLOY
echo "🚀 Backend deploy..."

cd ..

gcloud run deploy lfa-legacy-go-backend \
    --source ./backend \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=lfa-legacy-go" \
    --add-cloudsql-instances lfa-legacy-go:europe-west1:lfa-legacy-go-postgres \
    --quiet

echo "✅ Deploy sikeres!"

# 3. TESZT
echo "🧪 PostgreSQL teszt..."
sleep 15

curl -s "https://lfa-legacy-go-backend-376491487980.us-central1.run.app/health" > health_test.json

if grep -q "status.*ok" health_test.json; then
    echo "✅ HEALTH CHECK OK!"
    
    # Admin login teszt
    LOGIN_TEST=$(curl -s -X POST "https://lfa-legacy-go-backend-376491487980.us-central1.run.app/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}')
    
    if echo "$LOGIN_TEST" | grep -q "access_token"; then
        echo "🎉 POSTGRESQL MŰKÖDIK! ADMIN LOGIN SIKERES!"
        echo "🎮 FRONTEND MOST MÁR MŰKÖDNI FOG!"
    else
        echo "❌ Admin login nem sikerült"
        echo "$LOGIN_TEST"
    fi
else
    echo "❌ Health check fail"
    cat health_test.json
fi

rm -f health_test.json

echo ""
echo "🏁 FINISHED!"
echo "Frontend URL: https://lfa-legacy-go-frontend.netlify.app"
echo "Admin: admin / admin123"