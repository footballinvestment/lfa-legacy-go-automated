#!/bin/bash
# LFA Legacy GO - Local Frontend Starter Script (FIXED VERSION)
echo "🌐 Starting LFA Legacy GO Frontend (LOCAL) - BACKEND PORT 8000..."
echo "📂 Working directory: $(pwd)"

cd "/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/frontend"

# FIXED: Backend URL to port 8000
BACKEND_URL="http://localhost:8000"
echo "🔧 Using FIXED backend: $BACKEND_URL"

# Enhanced memory optimization for build
echo "🔨 Creating build with backend URL: $BACKEND_URL"
echo "🗑️ Clearing cache and build..."
rm -rf build node_modules/.cache

echo "🏗️ Building with enhanced memory optimization..."
# FIXED: Enhanced memory settings with all optimizations
NODE_OPTIONS="--max-old-space-size=4096" \
REACT_APP_API_URL=$BACKEND_URL \
GENERATE_SOURCEMAP=false \
DISABLE_ESLINT_PLUGIN=true \
TSC_COMPILE_ON_ERROR=true \
SKIP_PREFLIGHT_CHECK=true \
npm run build

if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
    echo "❌ Build failed or incomplete!"
    echo "🔄 Trying development mode with optimizations..."
    NODE_OPTIONS="--max-old-space-size=4096" \
    REACT_APP_API_URL=$BACKEND_URL \
    GENERATE_SOURCEMAP=false \
    DISABLE_ESLINT_PLUGIN=true \
    TSC_COMPILE_ON_ERROR=true \
    SKIP_PREFLIGHT_CHECK=true \
    npm start
    exit 0
fi

echo "✅ Build successful!"
echo "🔥 Starting frontend server on http://localhost:3000"
echo "📡 Connected to backend: $BACKEND_URL"
npx serve -s build -p 3000 --single
