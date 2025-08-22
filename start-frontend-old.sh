#!/bin/bash
# LFA Legacy GO - Frontend Starter Script

echo "🌐 Starting LFA Legacy GO Frontend..."
echo "📂 Working directory: $(pwd)"

# Navigate to frontend directory
cd "/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/frontend"

# Always rebuild with correct local API URL
echo "🔨 Creating fresh build with local backend URL..."
echo "🗑️ Clearing cache..."
rm -rf build node_modules/.cache

echo "🏗️ Building with local backend: http://localhost:8000"
echo "💾 System RAM: 8GB - Using adaptive memory limits"

# Adaptive memory with fallback chain for 8GB system
NODE_OPTIONS="--max-old-space-size=6144" REACT_APP_API_URL=http://localhost:8000 GENERATE_SOURCEMAP=false npm run build || \
NODE_OPTIONS="--max-old-space-size=4096" REACT_APP_API_URL=http://localhost:8000 GENERATE_SOURCEMAP=false npm run build || \
NODE_OPTIONS="--max-old-space-size=2048" REACT_APP_API_URL=http://localhost:8000 GENERATE_SOURCEMAP=false npm run build

# Start the frontend server
echo "🔥 Starting frontend server on http://localhost:3000"
echo "🔗 Connecting to backend: http://localhost:8000"
echo "📝 Use Ctrl+C to stop the server"
echo ""

npx serve -s build -p 3000