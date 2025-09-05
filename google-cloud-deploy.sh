#!/bin/bash
# LFA Legacy GO - FIXED Google Cloud Deploy Script

set -e

echo "🚀 LFA Legacy GO - Google Cloud Deploy"
echo "======================================="
echo "📅 Started: $(date)"

# Variables
PROJECT_ID="lfa-legacy-go" 
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
BACKEND_DIR="backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ]; then
    error "Backend directory not found. Run this script from the project root."
fi

log "Current directory: $(pwd)"
log "Backend directory: $(ls -la | grep backend)"

# Check gcloud authentication
log "Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    error "Not authenticated with Google Cloud. Run: gcloud auth login"
fi

# Set project
log "Setting Google Cloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Check if Cloud Run API is enabled
log "Checking Cloud Run API..."
if ! gcloud services list --enabled --filter="name:run.googleapis.com" --format="value(name)" | grep -q run.googleapis.com; then
    log "Enabling Cloud Run API..."
    gcloud services enable run.googleapis.com
    sleep 10
fi

# Navigate to backend
log "Navigating to backend directory..."
cd $BACKEND_DIR

# Show current backend structure
log "Backend files:"
ls -la | head -10

# Create .gcloudignore if it doesn't exist
if [ ! -f .gcloudignore ]; then
    cat > .gcloudignore << 'GCLOUDIGNORE'
.git
.gitignore
README.md
.pytest_cache
__pycache__
*.pyc
.env*
venv/
.vscode/
tests/
docs/
*.md
.DS_Store
migrations/
GCLOUDIGNORE
    log "Created .gcloudignore file"
fi

# Check for required files
log "Checking required files..."
if [ ! -f "requirements.txt" ]; then
    error "requirements.txt not found in backend directory"
fi

if [ ! -f "app/main.py" ]; then
    error "app/main.py not found - check backend structure"
fi

success "Backend structure verified"

# Create production environment config
log "Creating production environment configuration..."
cat > .env.production << 'PRODENV'
# Production Environment Variables
ENVIRONMENT=production
DEBUG=false

# Database - Cloud SQL PostgreSQL
DATABASE_URL=postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@34.65.123.456:5432/lfa_legacy_go

# Security
JWT_SECRET_KEY=prod-secure-key-change-this-in-deployment
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=https://lfa-legacy-go.netlify.app,http://localhost:3000

# Application
APP_NAME=LFA Legacy GO
APP_VERSION=1.0.0
PRODENV

log "Production environment file created"

# Deploy to Cloud Run with PostgreSQL support
log "Deploying to Cloud Run with database support..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 20 \
    --min-instances 1 \
    --port 8080 \
    --timeout 900 \
    --set-env-vars "ENVIRONMENT=production,DEBUG=false" \
    --set-env-vars "DATABASE_URL=postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@34.65.123.456:5432/lfa_legacy_go" \
    --set-env-vars "JWT_SECRET_KEY=prod-secure-key-$(date +%s)" \
    --set-env-vars "CORS_ORIGINS=https://lfa-legacy-go.netlify.app,http://localhost:3000" \
    --concurrency 80 \
    --execution-environment gen2

DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
    success "Deployment successful!"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo ""
    echo "🌍 Service URL: $SERVICE_URL"
    echo "📖 API Docs: $SERVICE_URL/docs"
    echo "💓 Health Check: $SERVICE_URL/health"
    
    # Wait for service to start
    log "Waiting 30 seconds for service to start..."
    sleep 30
    
    # Test the deployment
    log "Testing deployment..."
    
    # Test health endpoint
    if curl -f -m 10 "$SERVICE_URL/health" > /dev/null 2>&1; then
        success "Health check passed!"
        
        # Test API docs
        log "Testing API documentation..."
        if curl -f -m 10 "$SERVICE_URL/docs" > /dev/null 2>&1; then
            success "API docs accessible!"
        else
            warning "API docs may not be ready yet"
        fi
        
        # Test database connection through API
        log "Testing database connection..."
        DB_TEST=$(curl -s -m 10 "$SERVICE_URL/health/detailed" | grep -o '"database":[^,]*' || echo "No DB info")
        echo "Database status: $DB_TEST"
        
    else
        warning "Health check failed - checking logs for issues..."
        
        # Show recent deployment logs
        log "Recent deployment logs:"
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
            --limit=10 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
    fi
    
else
    error "Deployment failed with exit code: $DEPLOY_RESULT"
fi

cd ..
echo ""
echo "🎯 Deployment Summary:"
echo "======================"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "URL: $SERVICE_URL"
echo "Time: $(date)"
echo ""

if [ $DEPLOY_RESULT -eq 0 ]; then
    success "✅ Deploy completed successfully!"
    echo ""
    echo "🧪 Next steps:"
    echo "1. Test frontend login: https://lfa-legacy-go.netlify.app"
    echo "2. Check logs: ./check-backend-logs.sh"
    echo "3. Test API: $SERVICE_URL/docs"
else
    error "❌ Deploy failed - check logs for details"
fi