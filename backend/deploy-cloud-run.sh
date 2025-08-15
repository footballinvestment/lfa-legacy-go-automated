#!/bin/bash
# === LFA Legacy GO - Cloud Run Deployment Script ===

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}📋 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

print_step "🚀 LFA Legacy GO - Cloud Run Deployment Starting..."

# Add gcloud to PATH
export PATH="/Users/lovas.zoltan/google-cloud-sdk/bin:$PATH"

# Verify directory
if [ ! -f "app/main.py" ]; then
    print_error "app/main.py not found! Run from backend/ directory."
    exit 1
fi

# Check if authenticated
print_step "Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    print_error "Not authenticated. Please run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Enable APIs
print_step "Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Build Docker image
print_step "Building Docker image..."
gcloud builds submit --tag $IMAGE_NAME --timeout=20m

if [ $? -ne 0 ]; then
    print_error "Docker build failed!"
    exit 1
fi

# Deploy to Cloud Run
print_step "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 100 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars="ENVIRONMENT=production,API_TITLE=LFA Legacy GO API,API_VERSION=3.0.0,DEBUG=false,SECRET_KEY=lfa-legacy-go-jwt-secret-key-2024-production-ready,ACCESS_TOKEN_EXPIRE_MINUTES=43200" \
    --cpu-boost

if [ $? -ne 0 ]; then
    print_error "Cloud Run deployment failed!"
    exit 1
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

print_step "Testing deployment..."
sleep 15

# Health check
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Deployment successful! Health check passed."
else
    print_error "Health check failed with code: $HEALTH_RESPONSE"
    echo "Checking logs..."
    gcloud logging read "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"" --limit=10
fi

print_success "🎉 DEPLOYMENT COMPLETED!"
echo "🔗 Service URL: $SERVICE_URL"
echo "📚 API Docs: $SERVICE_URL/docs"
echo "✅ Health Check: $SERVICE_URL/health"

# Save deployment info
cat > deployment-info.txt << EOF
LFA Legacy GO - Cloud Run Deployment
====================================
Deployed: $(date)
Service URL: $SERVICE_URL
Project ID: $PROJECT_ID

API Documentation: $SERVICE_URL/docs
Health Check: $SERVICE_URL/health
EOF

print_success "Deployment info saved to deployment-info.txt"
exit 0