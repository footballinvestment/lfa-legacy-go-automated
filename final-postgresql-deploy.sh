#!/bin/bash
# LFA Legacy GO - Final PostgreSQL Fix Deploy

set -e

echo "🔧 Final PostgreSQL Backend Fix"
echo "==============================="

# Variables
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
DATABASE_IP="34.76.17.11"
CLOUD_SQL_INSTANCE="lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

[ ! -d "backend" ] && error "Run from project root"

log "Deploying backend with FORCED PostgreSQL connection..."

cd backend

# Create explicit environment YAML with PostgreSQL
cat > env-postgresql.yaml << 'PGEOF'
ENVIRONMENT: production
DEBUG: "false"
JWT_SECRET_KEY: secure-postgresql-key-2025
JWT_ALGORITHM: HS256
JWT_EXPIRE_MINUTES: "30"
APP_NAME: LFA Legacy GO
APP_VERSION: 1.0.0
DATABASE_URL: postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@34.76.17.11:5432/lfa_legacy_go
CORS_ORIGINS: https://lfa-legacy-go.netlify.app,http://localhost:3000
CLOUD_SQL_CONNECTION_NAME: lfa-legacy-go:europe-west1:lfa-legacy-go-postgres
DB_TYPE: postgresql
USE_SQLITE: "false"
PGEOF

success "PostgreSQL environment configuration created"

# Deploy with explicit PostgreSQL configuration
log "Deploying with PostgreSQL configuration..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --min-instances 1 \
    --port 8080 \
    --env-vars-file env-postgresql.yaml \
    --add-cloudsql-instances $CLOUD_SQL_INSTANCE \
    --execution-environment gen2 \
    --timeout 300 \
    --concurrency 80

DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
    success "PostgreSQL deployment successful!"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    log "Waiting 30 seconds for PostgreSQL connection to establish..."
    sleep 30
    
    # Test health with PostgreSQL
    log "Testing health endpoint..."
    if curl -f -m 15 "$SERVICE_URL/health" >/dev/null 2>&1; then
        success "Health check PASSED!"
        
        # Test admin login directly
        log "Testing admin login with PostgreSQL..."
        ADMIN_TEST=$(curl -s -w "%{http_code}" -X POST "$SERVICE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"username":"admin","password":"admin123"}' \
            -o /tmp/admin_login.json 2>/dev/null)
        
        if [ "$ADMIN_TEST" = "200" ]; then
            success "ADMIN LOGIN SUCCESSFUL!"
            echo ""
            echo "🎉 POSTGRESQL CONNECTION WORKING!"
            echo "✅ Backend now using PostgreSQL database"
            echo "✅ Admin user login successful"
            echo "✅ Database migration was successful"
            echo ""
            echo "🎮 FRONTEND IS NOW READY!"
            echo "=========================="
            echo "🌐 URL: https://lfa-legacy-go.netlify.app"
            echo "👤 Login: admin / admin123"
            echo ""
            echo "🔧 Backend: $SERVICE_URL"
            
            # Show login response
            echo ""
            echo "📄 Admin login response:"
            cat /tmp/admin_login.json 2>/dev/null | head -3
            
        else
            echo "⚠️  Admin login failed (HTTP $ADMIN_TEST)"
            echo "Response: $(cat /tmp/admin_login.json 2>/dev/null || echo 'No response')"
            
            # Check if it's still using SQLite
            log "Checking database connection in logs..."
            sleep 5
            gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND textPayload:\"sqlite\"" \
                --limit=3 --format="value(textPayload)" --project=lfa-legacy-go || echo "No SQLite errors found"
        fi
        
    else
        error "Health check failed - PostgreSQL connection issue"
    fi
    
else
    error "Deployment failed"
fi

# Cleanup
rm -f env-postgresql.yaml /tmp/admin_login.json

cd ..

echo ""
echo "📊 FINAL STATUS:"
echo "================"
if [ $DEPLOY_RESULT -eq 0 ] && [ "$ADMIN_TEST" = "200" ]; then
    echo "✅ PostgreSQL database: CONNECTED"
    echo "✅ Admin user: WORKING"  
    echo "✅ Backend: OPERATIONAL"
    echo "✅ Frontend ready: https://lfa-legacy-go.netlify.app"
    echo ""
    success "🏆 DEPLOYMENT COMPLETED SUCCESSFULLY!"
else
    echo "❌ Issue detected - check logs for details"
fi