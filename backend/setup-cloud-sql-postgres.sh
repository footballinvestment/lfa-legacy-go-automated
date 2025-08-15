#!/bin/bash
# === LFA Legacy GO - Cloud SQL PostgreSQL Setup ===
# Fix SQLite persistence issue

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "${BLUE}📋 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

# Configuration
PROJECT_ID="lfa-legacy-go"
DB_INSTANCE="lfa-legacy-go-db"
DB_NAME="lfa_legacy_go"
DB_USER="lfa_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REGION="us-central1"
SERVICE_NAME="lfa-legacy-go-backend"

echo "🗄️ LFA Legacy GO - PostgreSQL Database Setup"
echo "=============================================="
print_step "🗄️ Setting up Cloud SQL PostgreSQL for persistent storage..."

# Verify gcloud auth
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | head -1 > /dev/null; then
    print_warning "Not authenticated with Google Cloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
print_step "Enabling required APIs..."
gcloud services enable sqladmin.googleapis.com
gcloud services enable run.googleapis.com

# Check if instance already exists
if gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID 2>/dev/null; then
    print_step "Instance $DB_INSTANCE already exists, skipping creation..."
else
    print_step "Creating Cloud SQL PostgreSQL instance..."
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup \
        --maintenance-window-hour=3 \
        --maintenance-window-day=SUN \
        --project=$PROJECT_ID
    
    print_success "Cloud SQL instance created!"
fi

print_step "Creating database and user..."

# Create database
if gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE --project=$PROJECT_ID 2>/dev/null; then
    print_success "Database $DB_NAME created"
else
    print_step "Database $DB_NAME may already exist"
fi

# Create user
if gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE \
    --password=$DB_PASSWORD \
    --project=$PROJECT_ID 2>/dev/null; then
    print_success "User $DB_USER created"
else
    print_step "User $DB_USER may already exist"
fi

print_success "Database and user configured!"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID --format="value(connectionName)")
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

print_step "Updating Cloud Run service with PostgreSQL..."

# Check if service exists
if gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID 2>/dev/null; then
    # Update existing service
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --add-cloudsql-instances=$CONNECTION_NAME \
        --set-env-vars="DATABASE_URL=$DATABASE_URL,ENVIRONMENT=production"
    
    print_success "Cloud Run service updated with PostgreSQL!"
else
    print_warning "Cloud Run service $SERVICE_NAME not found"
    print_step "Service will be updated during deployment"
fi

# Save credentials securely
cat > database-credentials.txt << EOF
LFA Legacy GO - PostgreSQL Credentials
=====================================
Instance: $DB_INSTANCE
Database: $DB_NAME
Username: $DB_USER
Password: $DB_PASSWORD
Connection: $CONNECTION_NAME
Region: $REGION
Project: $PROJECT_ID
DATABASE_URL: $DATABASE_URL
Created: $(date)

IMPORTANT: Keep this file secure and do not commit to git!
EOF

print_success "Credentials saved to database-credentials.txt"

# Add to .gitignore if not already there
if ! grep -q "database-credentials.txt" .gitignore 2>/dev/null; then
    echo "database-credentials.txt" >> .gitignore
    print_step "Added database-credentials.txt to .gitignore"
fi

echo ""
echo "🎉 POSTGRESQL SETUP COMPLETE!"
echo "================================"
echo "🔗 Database URL: ${DATABASE_URL:0:60}..."
echo "💾 Credentials: database-credentials.txt"
echo "🚀 Cloud Run will use persistent PostgreSQL storage"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy application: ./ULTIMATE_DEPLOY.sh"
echo "2. Validate setup: ./VALIDATE_DEPLOYMENT.sh"
echo "3. Check config: ./check-database-config.sh"
echo ""
print_success "No more SQLite data loss - users will persist after restarts! 🎯"