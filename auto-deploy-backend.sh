#!/bin/bash
# LFA Legacy GO - Automated Backend Deployment
set -e

echo "🚀 LFA Legacy GO - Backend Auto Deploy"
echo "======================================"

# Configuration
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
SQL_INSTANCE="lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"

# Function for logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Function for error handling
error_exit() {
    echo "❌ ERROR: $1" >&2
    exit 1
}

# Step 1: Verify prerequisites
log "🔍 Checking prerequisites..."
which gcloud >/dev/null || error_exit "gcloud CLI not found"
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 >/dev/null || error_exit "Not authenticated with gcloud"

# Step 2: Verify backend directory
[ -d "./backend" ] || error_exit "Backend directory not found"
[ -f "./backend/app/main.py" ] || error_exit "Backend main.py not found"

# Step 3: Deploy backend
log "🏗️  Deploying backend to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source ./backend \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --concurrency 80 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --add-cloudsql-instances $SQL_INSTANCE \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --clear-env-vars \
    --quiet || error_exit "Backend deployment failed"

# Step 4: Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
log "✅ Backend deployed: $SERVICE_URL"

# Step 5: Health check
log "🏥 Running health check..."
sleep 15
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/health" || echo "FAILED")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    log "✅ Health check passed"
else
    error_exit "Health check failed: $HEALTH_RESPONSE"
fi

# Step 6: CORS verification
log "🌐 Verifying CORS configuration..."
CORS_TEST=$(curl -i -s -X OPTIONS "$SERVICE_URL/api/auth/register" \
    -H "Origin: https://lfa-legacy-go.netlify.app" \
    -H "Access-Control-Request-Method: POST" | grep -i "access-control-allow-origin" || echo "CORS_MISSING")

if [ "$CORS_TEST" != "CORS_MISSING" ]; then
    log "✅ CORS configured correctly"
else
    error_exit "CORS not configured properly"
fi

echo ""
echo "🎉 BACKEND DEPLOYMENT SUCCESSFUL!"
echo "📍 Service URL: $SERVICE_URL"
echo "🔗 Health: $SERVICE_URL/health"
echo "🌐 CORS: Enabled for Netlify"