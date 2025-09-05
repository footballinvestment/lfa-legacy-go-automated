#!/bin/bash

# 🔧 VÉGLEGES POSTGRESQL BACKEND FIX
# ====================================
echo "🔧 Végleges PostgreSQL Backend Fix"
echo "==================================="

# Timestamp for logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "A backend KÉNYSZERÍTJÜK PostgreSQL használatára..."

# Lépés 1: Explicit PostgreSQL környezeti változók beállítása
log "Creating explicit PostgreSQL environment configuration..."

# Cloud Run environment fájl létrehozása
cat > cloud-run-postgres.env << 'EOF'
# KÉNYSZERÍTETT POSTGRESQL KONFIGURÁCIÓ
DATABASE_URL=postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@/lfa_legacy_go?host=/cloudsql/lfa-legacy-go:europe-west1:lfa-legacy-go-postgres
CLOUD_SQL_CONNECTION_NAME=lfa-legacy-go:europe-west1:lfa-legacy-go-postgres
USE_SQLITE=false
FORCE_POSTGRESQL=true

# PostgreSQL kapcsolat részletei
POSTGRES_DB=lfa_legacy_go
POSTGRES_USER=lfa_user
POSTGRES_PASSWORD=NVI29jPjzKO68kJi8SMcp4cT
POSTGRES_HOST=/cloudsql/lfa-legacy-go:europe-west1:lfa-legacy-go-postgres
POSTGRES_PORT=5432

# Pool settings
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true

# Security & App settings
JWT_SECRET_KEY=lfa-legacy-go-production-secret-key-2024
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=https://lfa-legacy-go-frontend.netlify.app,https://lfa-legacy-go.netlify.app

# Google Cloud
GOOGLE_CLOUD_PROJECT=lfa-legacy-go
EOF

echo "✅ PostgreSQL environment variables configured"

# Lépés 2: Backend deploy explicit PostgreSQL környezettel
log "Deploying with PostgreSQL configuration..."

gcloud run deploy lfa-legacy-go-backend \
    --source ./backend \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --concurrency 80 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --env-vars-file cloud-run-postgres.env \
    --add-cloudsql-instances lfa-legacy-go:europe-west1:lfa-legacy-go-postgres \
    --quiet

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL deployment successful!"
else
    echo "❌ Deployment failed!"
    exit 1
fi

# Lépés 3: Várjunk a PostgreSQL kapcsolat kiépülésére
log "Waiting 30 seconds for PostgreSQL connection to establish..."
sleep 30

# Lépés 4: Health check
BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
log "Testing health endpoint..."

HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$BACKEND_URL/health" -o health_check.json)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check PASSED!"
else
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

# Lépés 5: PostgreSQL admin user tesztelése
log "Testing admin login with PostgreSQL..."

LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -o login_test.json)

if [ "$LOGIN_RESPONSE" = "200" ]; then
    echo "✅ ADMIN LOGIN SUCCESSFUL!"
    echo "🎉 POSTGRESQL CONNECTION WORKING!"
    echo "🎮 FRONTEND IS NOW READY!"
else
    echo "⚠️  Admin login failed (HTTP $LOGIN_RESPONSE)"
    echo "Response: $(cat login_test.json)"
    
    # Ellenőrizzük a logokat
    log "Checking database connection in logs..."
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lfa-legacy-go-backend" \
        --limit=5 \
        --format="value(textPayload)" \
        --freshness=5m
fi

# Lépés 6: Státusz jelentés
echo ""
echo "📊 FINAL STATUS:"
echo "================"

# Ellenőrizzük a logokat SQLite hibákra
SQLITE_ERRORS=$(gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lfa-legacy-go-backend AND textPayload:sqlite3" \
    --limit=1 \
    --format="value(textPayload)" \
    --freshness=5m)

if [ -n "$SQLITE_ERRORS" ]; then
    echo "❌ SQLite errors still detected - configuration problem"
    echo "🔍 Check: gcloud run services describe lfa-legacy-go-backend --region=us-central1"
else
    echo "✅ No SQLite errors - PostgreSQL working correctly"
fi

# Cleanup
rm -f health_check.json login_test.json cloud-run-postgres.env

echo ""
echo "🎯 Next steps:"
echo "1. Test frontend login at: https://lfa-legacy-go-frontend.netlify.app"
echo "2. Admin credentials: admin / admin123"
echo "3. Check logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=lfa-legacy-go-backend' --limit=10"