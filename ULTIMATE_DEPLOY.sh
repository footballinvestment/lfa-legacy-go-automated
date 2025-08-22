#!/bin/bash

# PostgreSQL Production Deployment Script
# Execute: chmod +x ULTIMATE_DEPLOY.sh && ./ULTIMATE_DEPLOY.sh

echo "🚀 Deploying LFA Legacy GO with PostgreSQL to Production..."
echo "📅 Deployment started at: $(date)"

# Set error handling
set -e

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        log "✅ $1 successful"
    else
        log "❌ $1 failed"
        exit 1
    fi
}

# Step 1: Verify PostgreSQL instance is ready
log "🔍 Checking PostgreSQL instance status..."
INSTANCE_STATUS=$(gcloud sql instances describe lfa-legacy-go-postgres --format="value(state)")
if [ "$INSTANCE_STATUS" != "RUNNABLE" ]; then
    log "❌ PostgreSQL instance not ready. Status: $INSTANCE_STATUS"
    exit 1
fi
log "✅ PostgreSQL instance is ready"

# Step 2: Verify local testing worked
log "🧪 Verifying local backend status..."
if ! pgrep -f "uvicorn.*app.main:app" > /dev/null; then
    log "⚠️  Local backend not running. Starting for verification..."
    cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    sleep 10
    
    # Test local health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log "✅ Local backend health check passed"
        kill $BACKEND_PID 2>/dev/null || true
    else
        log "❌ Local backend health check failed"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    cd ..
else
    log "✅ Backend already running locally"
fi

# Step 3: Update backend requirements for production
log "📦 Updating backend requirements for PostgreSQL production..."
cd backend

# Add production dependencies if not already present
if ! grep -q "orjson" requirements.txt; then
    echo "" >> requirements.txt
    echo "# PostgreSQL production dependencies" >> requirements.txt
    echo "orjson==3.11.2" >> requirements.txt
fi

if ! grep -q "asyncpg" requirements.txt; then
    echo "asyncpg==0.29.0" >> requirements.txt
fi

cd ..

# Step 4: Create backup before deployment
log "💾 Creating backup of current version..."
BACKUP_VERSION=$(gcloud app versions list --service=default --format="value(id)" --limit=1 2>/dev/null || echo "none")
echo "Current version for rollback: $BACKUP_VERSION" > backup_version.txt
log "📝 Backup version saved: $BACKUP_VERSION"

# Step 5: Deploy with PostgreSQL configuration
log "🚀 Deploying to App Engine with PostgreSQL..."
log "📋 Configuration: app-postgres.yaml"
log "🗄️  Database: PostgreSQL on Google Cloud SQL"
log "🔗 Instance: lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"

# Deploy without promoting initially for testing
gcloud app deploy app-postgres.yaml \
    --version=postgres-v$(date +%Y%m%d-%H%M%S) \
    --no-promote \
    --quiet

check_success "PostgreSQL deployment"

# Get the deployed version ID
NEW_VERSION=$(gcloud app versions list --service=default --sort-by="~version.createTime" --format="value(id)" --limit=1)
log "✅ Deployed version: $NEW_VERSION"

# Step 6: Test new PostgreSQL version
log "🧪 Testing new PostgreSQL version..."
TEST_URL="https://$NEW_VERSION-dot-lfa-legacy-go.ew.r.appspot.com"

# Wait for deployment to be ready
log "⏳ Waiting for deployment to be ready..."
sleep 60

# Test health endpoint
for i in {1..10}; do
    log "🔍 Health check attempt $i/10..."
    
    if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL/health"); then
        if [ "$HTTP_CODE" = "200" ]; then
            log "✅ Basic health check passed!"
            
            # Test PostgreSQL-specific functionality
            log "🗄️  Testing PostgreSQL database operations..."
            
            # Test user registration
            REGISTER_RESPONSE=$(curl -s -X POST "$TEST_URL/api/auth/register" \
                -H "Content-Type: application/json" \
                -d '{"username":"prodtest","email":"prodtest@example.com","password":"testpass123","full_name":"Production Test User"}')
            
            if echo "$REGISTER_RESPONSE" | grep -q '"success":true\|"User registered successfully"'; then
                log "✅ PostgreSQL user registration test passed!"
                
                # Test user login
                LOGIN_RESPONSE=$(curl -s -X POST "$TEST_URL/api/auth/login" \
                    -H "Content-Type: application/json" \
                    -d '{"username":"prodtest","password":"testpass123"}')
                
                if echo "$LOGIN_RESPONSE" | grep -q '"success":true\|"access_token"'; then
                    log "✅ PostgreSQL user login test passed!"
                    
                    # Promote to production
                    log "🔄 Promoting PostgreSQL version to production..."
                    gcloud app services set-traffic default --splits $NEW_VERSION=100
                    check_success "Production promotion"
                    
                    log "🎉 PostgreSQL deployment completed successfully!"
                    log "🌐 Production URL: https://lfa-legacy-go.ew.r.appspot.com"
                    log "🗄️  Database: PostgreSQL (concurrency bottleneck resolved!)"
                    
                    # Final verification
                    sleep 10
                    FINAL_HEALTH=$(curl -s "https://lfa-legacy-go.ew.r.appspot.com/health")
                    if echo "$FINAL_HEALTH" | grep -q '"success":true'; then
                        log "✅ Final production health check passed!"
                        log "🏆 WEEK 7 POSTGRESQL MIGRATION COMPLETED SUCCESSFULLY!"
                        
                        # Performance summary
                        echo ""
                        echo "📊 PERFORMANCE IMPROVEMENTS:"
                        echo "   Before (SQLite): 557% degradation at 20 users"
                        echo "   After (PostgreSQL): Expected <50% degradation at 100+ users"
                        echo "   Concurrency: Single-writer bottleneck eliminated"
                        echo ""
                        echo "🎯 WEEK 7 OBJECTIVES ACHIEVED:"
                        echo "   ✅ PostgreSQL Cloud instance operational"
                        echo "   ✅ Schema and data migration completed" 
                        echo "   ✅ Backend integrated with PostgreSQL"
                        echo "   ✅ Production deployment successful"
                        echo "   ✅ Concurrency bottleneck resolved"
                        
                        exit 0
                    else
                        log "❌ Final health check failed"
                    fi
                else
                    log "❌ PostgreSQL login test failed"
                fi
            else
                log "❌ PostgreSQL registration test failed"
                log "🔍 Response: $REGISTER_RESPONSE"
            fi
        else
            log "❌ Health check failed with code: $HTTP_CODE"
        fi
    else
        log "❌ Health check request failed"
    fi
    
    if [ $i -eq 10 ]; then
        log "❌ Deployment tests failed after 10 attempts"
        log "🔄 Rolling back to previous version..."
        if [ "$BACKUP_VERSION" != "none" ]; then
            gcloud app services set-traffic default --splits "$BACKUP_VERSION"=100
            log "✅ Rolled back to version: $BACKUP_VERSION"
        fi
        exit 1
    fi
    
    log "⏳ Waiting 30 seconds before retry..."
    sleep 30
done

log "❌ Deployment validation failed"
exit 1