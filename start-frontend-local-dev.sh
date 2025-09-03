#!/bin/bash
# LFA Legacy GO - Local Frontend (Development Mode)
echo "🌐 Starting LFA Legacy GO Frontend (LOCAL - DEV MODE)..."
echo "📂 Working directory: $(pwd)"

# Navigate to frontend directory
cd "/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/frontend"

# Set local backend URL
BACKEND_URL="http://localhost:8000"
echo "🔧 Using LOCAL backend: $BACKEND_URL"

# Start development server (no build needed, faster startup)
echo "🔥 Starting development server..."
echo "🔗 Connecting to backend: $BACKEND_URL"
echo "📝 Use Ctrl+C to stop the server"
echo ""

# Development mode with local backend (ultralow memory usage)
REACT_APP_API_URL=$BACKEND_URL npm run start:ultralow