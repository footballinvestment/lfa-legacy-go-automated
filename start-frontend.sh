#!/bin/bash
# LFA Legacy GO - Frontend Starter Script (FIXED)

echo "🌐 Starting LFA Legacy GO Frontend..."
echo "📂 Working directory: $(pwd)"

# Navigate to frontend directory
cd "/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/frontend"

# Check if we should use local or production backend
if [ "$1" = "--local" ]; then
    BACKEND_URL="http://localhost:8000"
    echo "🔧 Using LOCAL backend: $BACKEND_URL"
else
    BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
    echo "🔧 Using PRODUCTION backend: $BACKEND_URL"
fi

# Always rebuild with correct API URL
echo "🔨 Creating fresh build with backend URL: $BACKEND_URL"
echo "🗑️ Clearing cache..."
rm -rf build node_modules/.cache

echo "🏗️ Building with backend: $BACKEND_URL"
echo "💾 System RAM: 8GB - Using adaptive memory limits"

# Adaptive memory with fallback chain for 8GB system
NODE_OPTIONS="--max-old-space-size=6144" REACT_APP_API_URL=$BACKEND_URL GENERATE_SOURCEMAP=false npm run build || \
NODE_OPTIONS="--max-old-space-size=4096" REACT_APP_API_URL=$BACKEND_URL GENERATE_SOURCEMAP=false npm run build || \
NODE_OPTIONS="--max-old-space-size=2048" REACT_APP_API_URL=$BACKEND_URL GENERATE_SOURCEMAP=false npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed! Trying alternative approach..."
    exit 1
fi

# Verify the API URL was embedded correctly
echo "🔍 Verifying API URL in build..."
if grep -q "$BACKEND_URL" build/static/js/*.js; then
    echo "✅ Correct API URL found in build files"
else
    echo "⚠️ Warning: API URL not found in build files"
fi

# Start the frontend server
echo "🔥 Starting frontend server on http://localhost:3000"
echo "🔗 Connecting to backend: $BACKEND_URL"
echo "📝 Use Ctrl+C to stop the server"
echo ""

# Add info about expected behavior
echo "📋 Expected behavior after startup:"
echo "   - Console should show: '✅ API connectivity established'"
echo "   - No 'WRONG API_URL' error messages"
echo "   - Admin users should see admin panel link"
echo ""

npx serve -s build -p 3000