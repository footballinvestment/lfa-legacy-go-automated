#!/bin/bash

echo "🚀 LFA Legacy GO - Backend Deployment Script"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"

echo -e "${BLUE}📝 Step 1: Checking git status...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    echo -e "${BLUE}📝 Step 2: Adding all changes...${NC}"
    git add .
    
    echo -e "${BLUE}💬 Step 3: Creating commit...${NC}"
    read -p "Enter commit message (or press Enter for auto-message): " commit_msg
    if [[ -z "$commit_msg" ]]; then
        commit_msg="Backend update - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git commit -m "$commit_msg"
    
    echo -e "${BLUE}📤 Step 4: Pushing to GitHub...${NC}"
    git push origin main
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Git push failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

echo -e "${BLUE}🏗️  Step 5: Deploying to Google Cloud Run...${NC}"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Project: $PROJECT_ID"

# Start deployment
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --allow-unauthenticated \
    --project $PROJECT_ID \
    --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${BLUE}🔗 Service URL: https://$SERVICE_NAME-376491487980.us-central1.run.app${NC}"
    
    echo -e "${YELLOW}📝 Testing deployment...${NC}"
    sleep 5
    
    # Test the API
    API_RESPONSE=$(curl -s "https://$SERVICE_NAME-376491487980.us-central1.run.app/")
    if [[ $API_RESPONSE == *"LFA Legacy GO"* ]]; then
        echo -e "${GREEN}✅ API is responding correctly${NC}"
        
        # Test MFA endpoint
        MFA_RESPONSE=$(curl -s -X POST "https://$SERVICE_NAME-376491487980.us-central1.run.app/api/auth/mfa/complete")
        if [[ $MFA_RESPONSE == *"Field required"* ]]; then
            echo -e "${GREEN}✅ MFA endpoints are working${NC}"
        else
            echo -e "${YELLOW}⚠️  MFA endpoint may have issues${NC}"
        fi
    else
        echo -e "${RED}❌ API not responding correctly${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 BACKEND DEPLOYMENT COMPLETE!${NC}"
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "  1. Backend is live on Google Cloud"
    echo "  2. Update Netlify frontend manually if needed"
    echo "  3. Test the full application"
    
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the logs above for details"
    exit 1
fi