#!/bin/bash
# === LFA Legacy GO - Database Configuration Checker ===
# Comprehensive database setup verification and monitoring

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${PURPLE}🔍 $1${NC}"; }
print_step() { echo -e "${BLUE}📋 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"
PROJECT_ID="lfa-legacy-go"

print_header "LFA Legacy GO - Database Configuration Checker"
echo "=============================================================="

# Add gcloud to PATH
export PATH="/Users/lovas.zoltan/google-cloud-sdk/bin:$PATH"

# Check if service exists
print_step "Checking Cloud Run service status..."
if ! gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID &>/dev/null; then
    print_error "Cloud Run service '$SERVICE_NAME' not found!"
    print_step "Deploy the service first: ./ULTIMATE_DEPLOY.sh"
    exit 1
fi

print_success "Cloud Run service found"

# Check DATABASE_URL environment variable
print_step "Checking DATABASE_URL environment variable..."
DATABASE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(spec.template.spec.template.spec.containers[0].env[?name=='DATABASE_URL'].value)" 2>/dev/null || echo "")

if [ -z "$DATABASE_URL" ]; then
    print_error "No DATABASE_URL configured!"
    print_step "The service will use default SQLite (data loss risk)"
    print_step "🔧 Run: ./setup-cloud-sql-postgres.sh"
    echo ""
    echo "Current Environment Variables:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)" | grep -E "DATABASE|ENVIRONMENT" || echo "No database environment variables found"
elif [[ $DATABASE_URL == postgresql* ]]; then
    print_success "PostgreSQL configured: ${DATABASE_URL:0:70}..."
    
    # Extract connection details
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@/([^?]+)\?host=/cloudsql/([^&]+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_NAME="${BASH_REMATCH[3]}"
        CONNECTION_NAME="${BASH_REMATCH[4]}"
        
        print_step "Database Details:"
        echo "  - User: $DB_USER"
        echo "  - Database: $DB_NAME"
        echo "  - Connection: $CONNECTION_NAME"
    fi
elif [[ $DATABASE_URL == sqlite* ]]; then
    print_warning "SQLite configured - data loss risk on restart!"
    print_step "Database: ${DATABASE_URL}"
    print_step "🔧 Recommended: ./setup-cloud-sql-postgres.sh"
else
    print_warning "Unknown database type: ${DATABASE_URL:0:50}..."
fi

# Check Cloud SQL instances
print_step "Checking Cloud SQL instances..."
echo ""
if gcloud sql instances list --project=$PROJECT_ID --format="table(name,databaseVersion,region,settings.tier,state)" 2>/dev/null | grep -q "lfa-legacy-go"; then
    print_success "Cloud SQL instances found:"
    gcloud sql instances list --project=$PROJECT_ID --format="table(name,databaseVersion,region,settings.tier,state)" | grep "lfa-legacy-go"
else
    print_warning "No Cloud SQL instances found"
    print_step "Create with: ./setup-cloud-sql-postgres.sh"
fi

# Check Cloud SQL connection in Cloud Run
print_step "Checking Cloud SQL connection configuration..."
CLOUDSQL_INSTANCES=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(spec.template.metadata.annotations.'run.googleapis.com/cloudsql-instances')" 2>/dev/null || echo "")

if [ -n "$CLOUDSQL_INSTANCES" ]; then
    print_success "Cloud SQL connection configured: $CLOUDSQL_INSTANCES"
else
    print_warning "No Cloud SQL connection configured"
    print_step "Cloud Run is not connected to Cloud SQL"
fi

# Test live service health
print_step "Testing live service database status..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    print_step "Service URL: $SERVICE_URL"
    
    # Test health endpoint
    if HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/health" 2>/dev/null); then
        print_success "Health endpoint accessible"
        
        # Check database status
        if echo "$HEALTH_RESPONSE" | jq -e '.database' | grep -q "connected" 2>/dev/null; then
            print_success "Database status: CONNECTED"
        else
            print_error "Database status: NOT CONNECTED"
        fi
        
        # Check database type
        if DB_TYPE=$(echo "$HEALTH_RESPONSE" | jq -r '.database_type' 2>/dev/null); then
            if [[ $DB_TYPE == "postgresql" ]]; then
                print_success "Database type: PostgreSQL (persistent)"
            elif [[ $DB_TYPE == "sqlite" ]]; then
                print_warning "Database type: SQLite (temporary)"
            else
                print_step "Database type: $DB_TYPE"
            fi
        fi
        
        # Show detailed health info
        print_step "Full health status:"
        echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
        
    else
        print_error "Cannot reach health endpoint"
        print_step "Service may be starting up or misconfigured"
    fi
else
    print_error "Cannot determine service URL"
fi

# Recommendations
echo ""
print_header "RECOMMENDATIONS"
echo "=============================================================="

if [[ $DATABASE_URL == postgresql* ]] && [[ -n "$CLOUDSQL_INSTANCES" ]]; then
    print_success "✅ PostgreSQL properly configured - users will persist!"
    print_step "🎯 Database setup is production-ready"
    print_step "📊 Monitor usage in Google Cloud Console"
elif [[ -z "$DATABASE_URL" ]] || [[ $DATABASE_URL == sqlite* ]]; then
    print_warning "⚠️ SQLite configuration detected - action required:"
    echo ""
    echo "  1. Setup PostgreSQL: ./setup-cloud-sql-postgres.sh"
    echo "  2. Redeploy application: ./ULTIMATE_DEPLOY.sh"
    echo "  3. Validate setup: ./VALIDATE_DEPLOYMENT.sh"
    echo ""
    print_error "❌ Current setup will lose user data on restart!"
else
    print_step "Configuration partially complete - verify all components"
fi

# Save report
cat > database-config-report.txt << EOF
LFA Legacy GO - Database Configuration Report
============================================
Check Date: $(date)
Service: $SERVICE_NAME
Region: $REGION
Project: $PROJECT_ID

DATABASE CONFIGURATION:
======================
DATABASE_URL: ${DATABASE_URL:-"Not configured"}
Cloud SQL Instances: ${CLOUDSQL_INSTANCES:-"None"}
Service URL: ${SERVICE_URL:-"Not available"}

LIVE SERVICE STATUS:
===================
$(if [ -n "$SERVICE_URL" ]; then
    curl -s "$SERVICE_URL/health" 2>/dev/null | jq '.' 2>/dev/null || echo "Health endpoint not responding"
else
    echo "Service not accessible"
fi)

RECOMMENDATIONS:
===============
$(if [[ $DATABASE_URL == postgresql* ]] && [[ -n "$CLOUDSQL_INSTANCES" ]]; then
    echo "✅ PostgreSQL properly configured - production ready"
else
    echo "⚠️ Setup required: ./setup-cloud-sql-postgres.sh"
fi)

EOF

print_success "Report saved: database-config-report.txt"

echo ""
echo "=============================================================="
if [[ $DATABASE_URL == postgresql* ]] && [[ -n "$CLOUDSQL_INSTANCES" ]]; then
    print_header "🎉 DATABASE CONFIGURATION: PERFECT!"
    print_success "PostgreSQL is properly configured and connected"
    print_success "User data will persist across restarts"
else
    print_header "⚠️ DATABASE CONFIGURATION: NEEDS ATTENTION"
    print_warning "SQLite detected - run PostgreSQL setup"
fi
echo "=============================================================="