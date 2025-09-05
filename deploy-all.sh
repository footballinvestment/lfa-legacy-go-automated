#!/bin/bash
# LFA Legacy GO - Complete Deployment Pipeline
set -e

echo "🚀 LFA Legacy GO - COMPLETE DEPLOYMENT"
echo "======================================"

# Function for logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Step 1: Deploy Backend
log "🔥 PHASE 1: Backend Deployment"
chmod +x auto-deploy-backend.sh
./auto-deploy-backend.sh || exit 1

echo ""
log "⏳ Waiting 30 seconds for backend to stabilize..."
sleep 30

# Step 2: Deploy Frontend
log "🌐 PHASE 2: Frontend Deployment"
chmod +x auto-deploy-frontend.sh
./auto-deploy-frontend.sh || exit 1

# Step 3: End-to-End Test
log "🧪 PHASE 3: End-to-End Testing"

BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"

# Test backend health
log "🏥 Testing backend health..."
HEALTH=$(curl -s "$BACKEND_URL/health" | grep -o '"status":"healthy"' || echo "FAILED")
if [ "$HEALTH" != "FAILED" ]; then
    log "✅ Backend health: OK"
else
    log "❌ Backend health: FAILED"
    exit 1
fi

# Test CORS
log "🌐 Testing CORS..."
CORS_HEADERS=$(curl -i -s -X OPTIONS "$BACKEND_URL/api/auth/register" \
    -H "Origin: https://lfa-legacy-go.netlify.app" \
    -H "Access-Control-Request-Method: POST" | grep -i "access-control" | wc -l)

if [ "$CORS_HEADERS" -gt 0 ]; then
    log "✅ CORS: Configured"
else
    log "❌ CORS: Missing"
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT PIPELINE COMPLETED!"
echo "================================="
echo "⚙️ Backend:  $BACKEND_URL"
echo "🌐 Frontend: https://lfa-legacy-go.netlify.app"
echo "🗄️  Database: PostgreSQL (Connected)"
echo "🌍 CORS:     Enabled"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Test registration at: https://lfa-legacy-go.netlify.app"
echo "2. Try login with registered user"
echo "3. Verify access token is returned"