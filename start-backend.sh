#!/bin/bash
# LFA Legacy GO - Backend Starter Script

echo "🚀 Starting LFA Legacy GO Backend..."
echo "📂 Working directory: $(pwd)"

# Navigate to backend directory
cd "/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/backend"

# Activate Python virtual environment
echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

# Start the backend server
echo "🔥 Starting FastAPI server on http://localhost:8000"
echo "📝 Use Ctrl+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000