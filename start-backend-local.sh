#!/bin/bash
# LFA Legacy GO - Local Backend Starter Script (FIXED VERSION)
echo "🚀 Starting LFA Legacy GO Backend (LOCAL) - PORT 8001..."
echo "📂 Working directory: $(pwd)"

# Navigate to backend directory
cd "/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/backend"

# Activate Python virtual environment
echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

# Verify Python 3.11 is active
echo "🔍 Verifying Python version compatibility..."
PYTHON_VERSION=$(python --version 2>&1)
echo "📋 Active Python: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" != *"3.11"* ]]; then
    echo "❌ ERROR: Python 3.11 required for compatibility"
    echo "💡 Current version: $PYTHON_VERSION"
    exit 1
else
    echo "✅ Python 3.11 confirmed - proceeding..."
fi

# Start the backend server on PORT 8001
echo "🔥 Starting FastAPI server on http://localhost:8001"
echo "📝 Use Ctrl+C to stop the server"
echo "🔧 Fixed port to avoid conflicts with existing instance"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8001