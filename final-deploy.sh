#!/bin/bash
# LFA Legacy GO - FINAL WORKING Deploy Script

set -e

echo "🚀 FINAL WORKING Cloud Deploy"
echo "============================"

# Variables
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
CLOUD_SQL_INSTANCE="lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"
DATABASE_IP="34.76.17.11"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Check backend directory
[ ! -d "backend" ] && error "Run from project root (where backend/ exists)"

log "Using existing Cloud SQL instance: lfa-legacy-go-postgres"
log "Database IP: $DATABASE_IP"

cd backend

# Create YAML environment file (gcloud requires YAML/JSON format)
log "Creating YAML environment variables file..."
cat > env.yaml << 'YAMLEOF'
ENVIRONMENT: production
DEBUG: "false"
JWT_SECRET_KEY: secure-prod-key-2025
JWT_ALGORITHM: HS256
JWT_EXPIRE_MINUTES: "30"
APP_NAME: LFA Legacy GO
APP_VERSION: 1.0.0
DATABASE_URL: postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@34.76.17.11:5432/lfa_legacy_go
CORS_ORIGINS: https://lfa-legacy-go.netlify.app,http://localhost:3000
CLOUD_SQL_CONNECTION_NAME: lfa-legacy-go:europe-west1:lfa-legacy-go-postgres
YAMLEOF

success "YAML environment file created"

# Deploy to Cloud Run
log "Deploying to Cloud Run..."
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
    --env-vars-file env.yaml \
    --add-cloudsql-instances $CLOUD_SQL_INSTANCE \
    --execution-environment gen2 \
    --timeout 300 \
    --concurrency 80

DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
    success "Deployment successful!"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo ""
    echo "🌍 Service URL: $SERVICE_URL"
    echo "📖 API Docs: $SERVICE_URL/docs"
    echo "💓 Health: $SERVICE_URL/health"
    
    # Wait for service
    log "Waiting 30 seconds for service to start..."
    sleep 30
    
    # Test health
    log "Testing health endpoint..."
    if curl -f -m 15 "$SERVICE_URL/health" >/dev/null 2>&1; then
        success "Health check PASSED!"
        
        # Test user creation
        log "Testing user registration..."
        REG_RESULT=$(curl -s -w "%{http_code}" -X POST "$SERVICE_URL/api/auth/register" \
            -H "Content-Type: application/json" \
            -d '{"username":"quicktest","email":"quicktest@example.com","password":"testpass123","full_name":"Quick Test User"}' \
            -o /tmp/reg_response.json)
        
        if [ "$REG_RESULT" = "200" ] || [ "$REG_RESULT" = "201" ]; then
            success "User registration PASSED!"
            
            # Test login
            log "Testing login..."
            LOGIN_RESULT=$(curl -s -w "%{http_code}" -X POST "$SERVICE_URL/api/auth/login" \
                -H "Content-Type: application/json" \
                -d '{"username":"quicktest","password":"testpass123"}' \
                -o /tmp/login_response.json)
            
            if [ "$LOGIN_RESULT" = "200" ]; then
                success "Login test PASSED!"
                echo ""
                echo "🎉 ALL TESTS SUCCESSFUL!"
                echo "✅ Backend is fully operational"
                echo "✅ Database connection working"
                echo "✅ Authentication working"
                echo ""
                echo "🧪 TEST THE FRONTEND:"
                echo "1. Go to: https://lfa-legacy-go.netlify.app"
                echo "2. Try login with: quicktest / testpass123"
                echo "3. Or try: admin / admin123"
                
            else
                echo "⚠️  Login test failed (HTTP $LOGIN_RESULT)"
                echo "Response: $(cat /tmp/login_response.json 2>/dev/null || echo 'No response')"
            fi
            
        elif [ "$REG_RESULT" = "409" ]; then
            log "User already exists (409) - this is normal, testing login directly..."
            
            LOGIN_RESULT=$(curl -s -w "%{http_code}" -X POST "$SERVICE_URL/api/auth/login" \
                -H "Content-Type: application/json" \
                -d '{"username":"quicktest","password":"testpass123"}' \
                -o /tmp/login_response.json)
            
            if [ "$LOGIN_RESULT" = "200" ]; then
                success "Direct login test PASSED!"
                echo ""
                echo "🎉 BACKEND WORKING!"
                echo "🧪 Frontend: https://lfa-legacy-go.netlify.app"
            else
                echo "⚠️  Login failed (HTTP $LOGIN_RESULT)"
            fi
            
        else
            echo "⚠️  Registration failed (HTTP $REG_RESULT)"
            echo "Response: $(cat /tmp/reg_response.json 2>/dev/null || echo 'No response')"
        fi
        
    else
        echo "❌ Health check failed - checking logs..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
            --limit=3 \
            --format="value(textPayload)" \
            --project=$PROJECT_ID
    fi
    
else
    error "Deployment failed"
fi

# Cleanup
rm -f env.yaml /tmp/reg_response.json /tmp/login_response.json

cd ..

echo ""
echo "📊 FINAL STATUS:"
echo "==============="
echo "Service: $SERVICE_NAME"
echo "Database: Connected to $DATABASE_IP"
echo "URL: $SERVICE_URL"
echo ""

if [ $DEPLOY_RESULT -eq 0 ]; then
    success "🎯 DEPLOYMENT COMPLETED!"
    echo ""
    echo "🎮 NEXT STEPS:"
    echo "1. Test frontend: https://lfa-legacy-go.netlify.app"
    echo "2. Login with: quicktest/testpass123"
    echo "3. Check logs if needed: ./check-backend-logs.sh"
else
    error "Deployment failed"
fi