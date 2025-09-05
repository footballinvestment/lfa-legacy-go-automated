#!/bin/bash
# LFA Legacy GO - Backend Logs Checker

set -e

# Variables
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

echo "🔍 LFA Legacy GO - Backend Logs Checker"
echo "======================================="

# Check gcloud authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with Google Cloud. Run: gcloud auth login${NC}"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID > /dev/null 2>&1

echo ""
echo -e "${YELLOW}📋 Choose log type:${NC}"
echo "1. Recent errors (last 50)"
echo "2. All recent logs (last 100)" 
echo "3. Live tail (real-time)"
echo "4. Login attempts (last 50)"
echo "5. Health check failures"
echo "6. 500 errors specifically"
echo "7. Database connection errors"
echo "8. Authentication errors"

read -p "Enter choice (1-8): " choice

case $choice in
    1)
        log "Fetching recent error logs..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND severity>=ERROR" \
            --limit=50 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    2)
        log "Fetching all recent logs..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
            --limit=100 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    3)
        log "Starting live log tail (press Ctrl+C to stop)..."
        gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    4)
        log "Fetching login attempt logs..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND (textPayload:\"login\" OR textPayload:\"auth\" OR textPayload:\"Login\" OR textPayload:\"debugadmin2\")" \
            --limit=50 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    5)
        log "Fetching health check failures..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND textPayload:\"health\"" \
            --limit=30 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    6)
        log "Fetching 500 error logs..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND (httpRequest.status=500 OR textPayload:\"500\" OR severity=ERROR)" \
            --limit=50 \
            --format="table(timestamp,severity,httpRequest.status,textPayload)" \
            --project=$PROJECT_ID
        ;;
    7)
        log "Fetching database connection errors..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND (textPayload:\"database\" OR textPayload:\"connection\" OR textPayload:\"postgres\" OR textPayload:\"sql\")" \
            --limit=30 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    8)
        log "Fetching authentication errors..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND (textPayload:\"debugadmin2\" OR textPayload:\"Authentication\" OR textPayload:\"Invalid\" OR textPayload:\"Failed\")" \
            --limit=30 \
            --format="table(timestamp,severity,textPayload)" \
            --project=$PROJECT_ID
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Logs fetched successfully${NC}"
echo ""
echo -e "${YELLOW}💡 Quick Actions:${NC}"
echo "🔄 Deploy again: ./google-cloud-deploy.sh"
echo "🌍 Service URL: https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
echo "📖 API Docs: https://lfa-legacy-go-backend-376491487980.us-central1.run.app/docs"
echo "💓 Health: https://lfa-legacy-go-backend-376491487980.us-central1.run.app/health"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo "- Service status: gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "- Service URL: gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'"
echo "- Delete service: gcloud run services delete $SERVICE_NAME --region=$REGION"