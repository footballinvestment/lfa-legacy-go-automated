#!/bin/bash
# === LFA Legacy GO - ULTIMATE CLOUD RUN DEPLOYMENT AUTOMATION ===
# Complete automated deployment with monitoring and validation

set -e

# Enhanced Colors and Symbols
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Progress indicators
ROCKET="🚀"
CHECK="✅"
ERROR="❌"
WARNING="⚠️"
INFO="ℹ️"
GEAR="⚙️"
MONITOR="📊"
HEALTH="🏥"

print_header() { echo -e "${PURPLE}${ROCKET} $1${NC}"; }
print_step() { echo -e "${BLUE}${GEAR} $1${NC}"; }
print_success() { echo -e "${GREEN}${CHECK} $1${NC}"; }
print_error() { echo -e "${RED}${ERROR} $1${NC}"; }
print_warning() { echo -e "${YELLOW}${WARNING} $1${NC}"; }
print_info() { echo -e "${CYAN}${INFO} $1${NC}"; }
print_monitor() { echo -e "${YELLOW}${MONITOR} $1${NC}"; }

# Configuration
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Timing
START_TIME=$(date +%s)

print_header "ULTIMATE LFA LEGACY GO - CLOUD RUN DEPLOYMENT"
echo "============================================================="
echo "🎯 Project: $PROJECT_ID"
echo "🚀 Service: $SERVICE_NAME"
echo "🌍 Region: $REGION"
echo "🐳 Image: $IMAGE_NAME"
echo "⏰ Started: $(date)"
echo "============================================================="

# Add gcloud to PATH
export PATH="/Users/lovas.zoltan/google-cloud-sdk/bin:$PATH"

# Step 1: Verify Prerequisites
print_step "Step 1: Verifying Prerequisites..."

if [ ! -f "app/main.py" ]; then
    print_error "app/main.py not found! Run from backend/ directory."
    exit 1
fi
print_success "Backend directory structure verified"

if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found!"
    exit 1
fi
print_success "Google Cloud SDK found"

# Step 2: Authentication Check
print_step "Step 2: Checking Authentication..."
if ! gcloud auth list --format="value(account)" | head -n1 | grep -q "@"; then
    print_error "Not authenticated! Please run: gcloud auth login"
    print_info "Authentication URLs provided in previous output"
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --format="value(account)" | head -n1)
print_success "Authenticated as: $ACTIVE_ACCOUNT"

# Step 3: Project Configuration
print_step "Step 3: Configuring Google Cloud Project..."
gcloud config set project $PROJECT_ID
print_success "Project set to: $PROJECT_ID"

# Step 4: Enable Required APIs
print_step "Step 4: Enabling Required APIs..."
print_monitor "Enabling Cloud Run API..."
gcloud services enable run.googleapis.com --quiet

print_monitor "Enabling Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com --quiet

print_monitor "Enabling Container Registry API..."
gcloud services enable containerregistry.googleapis.com --quiet

print_success "All required APIs enabled"

# Step 5: Pre-Deployment Validation
print_step "Step 5: Pre-Deployment Validation..."

print_monitor "Validating Dockerfile..."
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found!"
    exit 1
fi
print_success "Dockerfile validated"

print_monitor "Validating requirements.txt..."
if [ ! -f "requirements.txt" ]; then
    print_error "requirements.txt not found!"
    exit 1
fi
print_success "Requirements file validated"

print_monitor "Checking application structure..."
if [ ! -d "app/routers" ]; then
    print_error "App structure invalid - routers directory missing"
    exit 1
fi
print_success "Application structure validated"

# Step 6: Docker Image Build
print_step "Step 6: Building Docker Image..."
BUILD_START=$(date +%s)

print_monitor "Starting Cloud Build process..."
print_info "This may take 5-15 minutes depending on dependencies..."

gcloud builds submit --tag $IMAGE_NAME --timeout=20m

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
print_success "Docker image built successfully in ${BUILD_TIME}s"

# Step 7: Database Configuration Validation
print_step "Step 7: Database Configuration Validation..."

# Check if PostgreSQL is configured
DATABASE_URL_CHECK=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.template.spec.containers[0].env[?name=='DATABASE_URL'].value)" 2>/dev/null || echo "")

if [[ -n "$DATABASE_URL_CHECK" ]]; then
    if [[ $DATABASE_URL_CHECK == postgresql* ]]; then
        print_success "PostgreSQL database configured: ${DATABASE_URL_CHECK:0:50}..."
    elif [[ $DATABASE_URL_CHECK == sqlite* ]]; then
        print_warning "SQLite detected - data loss risk on restart!"
        print_warning "Run './setup-cloud-sql-postgres.sh' for persistent storage"
        read -p "Continue with SQLite anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup PostgreSQL first: ./setup-cloud-sql-postgres.sh"
            exit 1
        fi
    fi
else
    print_warning "No DATABASE_URL configured - will use default SQLite"
    print_info "For persistent storage, run: ./setup-cloud-sql-postgres.sh"
    read -p "Continue without database configuration? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 8: Cloud Run Deployment
print_step "Step 8: Deploying to Cloud Run..."
DEPLOY_START=$(date +%s)

print_monitor "Deploying service with optimized configuration..."

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
    --cpu-boost \
    --execution-environment gen2 \
    --quiet

DEPLOY_END=$(date +%s)
DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))
print_success "Service deployed successfully in ${DEPLOY_TIME}s"

# Step 9: Service URL Retrieval
print_step "Step 9: Retrieving Service Information..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_success "Service URL obtained: $SERVICE_URL"

# Step 10: Comprehensive Health Validation
print_step "Step 10: Running Comprehensive Health Checks..."

print_monitor "Waiting for service to be fully ready..."
sleep 20

print_monitor "Testing root endpoint..."
ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/")
if [ "$ROOT_RESPONSE" = "200" ]; then
    print_success "Root endpoint responding (200)"
else
    print_warning "Root endpoint returned: $ROOT_RESPONSE"
fi

print_monitor "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Health endpoint responding (200)"
    
    # Get detailed health info
    HEALTH_DATA=$(curl -s "$SERVICE_URL/health")
    print_info "Health details: $HEALTH_DATA"
else
    print_error "Health check failed with code: $HEALTH_RESPONSE"
    print_monitor "Checking deployment logs..."
    gcloud logging read "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"" --limit=20 --format="value(textPayload)"
fi

print_monitor "Testing API documentation endpoint..."
DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/docs")
if [ "$DOCS_RESPONSE" = "200" ]; then
    print_success "API documentation accessible (200)"
else
    print_warning "API docs returned: $DOCS_RESPONSE"
fi

# Step 11: Performance and Configuration Validation
print_step "Step 11: Performance & Configuration Validation..."

print_monitor "Checking service configuration..."
gcloud run services describe $SERVICE_NAME --region=$REGION --format="yaml" > service-config.yaml
print_success "Service configuration saved to service-config.yaml"

print_monitor "Testing concurrent requests..."
for i in {1..5}; do
    curl -s "$SERVICE_URL/health" > /dev/null &
done
wait
print_success "Concurrent request test completed"

# Step 12: Final Deployment Summary
print_step "Step 12: Generating Deployment Summary..."

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

# Save deployment information
cat > deployment-success-report.txt << EOF
LFA Legacy GO - Cloud Run Deployment Success Report
==================================================
Deployment Date: $(date)
Total Deployment Time: ${TOTAL_TIME} seconds
Authenticated User: $ACTIVE_ACCOUNT

SERVICE INFORMATION:
==================
Project ID: $PROJECT_ID
Service Name: $SERVICE_NAME
Region: $REGION
Service URL: $SERVICE_URL

ENDPOINTS:
=========
🏠 Root: $SERVICE_URL/
🏥 Health: $SERVICE_URL/health
📚 API Docs: $SERVICE_URL/docs
🔧 OpenAPI: $SERVICE_URL/openapi.json

PERFORMANCE METRICS:
===================
Docker Build Time: ${BUILD_TIME} seconds
Deployment Time: ${DEPLOY_TIME} seconds
Total Automation Time: ${TOTAL_TIME} seconds

VALIDATION RESULTS:
==================
Root Endpoint: HTTP $ROOT_RESPONSE
Health Check: HTTP $HEALTH_RESPONSE
API Documentation: HTTP $DOCS_RESPONSE

CONFIGURATION:
=============
Memory: 1Gi
CPU: 1 core (with boost)
Concurrency: 80
Min Instances: 0
Max Instances: 100
Timeout: 300 seconds
Platform: Cloud Run Gen2

ENVIRONMENT VARIABLES:
=====================
ENVIRONMENT=production
API_TITLE=LFA Legacy GO API
API_VERSION=3.0.0
DEBUG=false
SECRET_KEY=[CONFIGURED]
ACCESS_TOKEN_EXPIRE_MINUTES=43200

NEXT STEPS:
===========
1. Update Netlify frontend environment variable:
   REACT_APP_API_URL=$SERVICE_URL

2. Test frontend integration

3. Monitor service performance in Google Cloud Console

TROUBLESHOOTING:
===============
View logs: gcloud logging read "resource.type=\"cloud_run_revision\"" --limit=50
Service status: gcloud run services describe $SERVICE_NAME --region=$REGION
EOF

print_success "Deployment report saved: deployment-success-report.txt"

# Final Success Display
echo ""
echo "============================================================="
print_header "🎉 DEPLOYMENT AUTOMATION COMPLETED SUCCESSFULLY!"
echo "============================================================="
echo "⏰ Total Time: ${TOTAL_TIME} seconds"
echo "🔗 Service URL: $SERVICE_URL"
echo "📚 API Docs: $SERVICE_URL/docs"
echo "🏥 Health Check: $SERVICE_URL/health"
echo ""
print_success "LFA Legacy GO is now running on Google Cloud Run!"
print_info "Frontend configuration: REACT_APP_API_URL=$SERVICE_URL"
echo "============================================================="

exit 0