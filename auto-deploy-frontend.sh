#!/bin/bash
# LFA Legacy GO - Automated Frontend Deployment
set -e

echo "🌐 LFA Legacy GO - Frontend Auto Deploy"
echo "======================================="

# Configuration
BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
NETLIFY_SITE_NAME="lfa-legacy-go"

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
[ -d "./frontend" ] || error_exit "Frontend directory not found"
which npm >/dev/null || error_exit "npm not found"
which node >/dev/null || error_exit "node not found"

# Step 2: Install dependencies
log "📦 Installing dependencies..."
cd frontend
npm ci || error_exit "npm install failed"

# Step 3: Create optimized build
log "🏗️  Building production frontend..."
log "🔗 Backend URL: $BACKEND_URL"

# Memory optimization for build
export NODE_OPTIONS="--max-old-space-size=8192"
export GENERATE_SOURCEMAP=false
export REACT_APP_API_URL="$BACKEND_URL"

# Build with retry logic
for i in {1..3}; do
    log "📦 Build attempt $i/3..."
    if npm run build; then
        log "✅ Build successful"
        break
    else
        if [ $i -eq 3 ]; then
            error_exit "Build failed after 3 attempts"
        fi
        log "⚠️  Build failed, retrying with reduced memory..."
        export NODE_OPTIONS="--max-old-space-size=4096"
    fi
done

# Step 4: Verify build
[ -d "./build" ] || error_exit "Build directory not created"
[ -f "./build/index.html" ] || error_exit "Build index.html not found"

# Step 5: Check if netlify CLI is available
if which netlify >/dev/null; then
    log "🌐 Deploying with Netlify CLI..."
    netlify deploy --prod --dir=build --site=$NETLIFY_SITE_NAME || log "⚠️  Netlify CLI deploy failed, manual upload required"
else
    log "📋 Netlify CLI not found - Manual deployment required:"
    log "   1. Go to https://app.netlify.com/"
    log "   2. Drag & drop the 'frontend/build' folder"
    log "   3. Set site name to: $NETLIFY_SITE_NAME"
fi

# Step 6: Build verification
BUILD_SIZE=$(du -sh build | cut -f1)
log "📊 Build size: $BUILD_SIZE"
log "🔗 Backend configured: $BACKEND_URL"

echo ""
echo "🎉 FRONTEND BUILD COMPLETED!"
echo "📁 Build location: frontend/build"
echo "🌐 Ready for Netlify deployment"
echo "🔗 Backend URL embedded: $BACKEND_URL"

cd ..