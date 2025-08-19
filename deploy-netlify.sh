#!/bin/bash

# === LFA Legacy GO - Netlify Deployment Script ===

echo "🚀 Starting LFA Legacy GO Netlify Deployment"

# Check if build directory exists
if [ ! -d "frontend/build" ]; then
    echo "❌ Build directory not found. Please build the project first."
    exit 1
fi

# Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
    echo "❌ netlify.toml not found. Please ensure configuration file exists."
    exit 1
fi

# Set environment variables for production
export REACT_APP_API_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
export REACT_APP_DEBUG="false"

echo "✅ Environment configured"
echo "   API URL: $REACT_APP_API_URL"
echo "   Debug: $REACT_APP_DEBUG"

# Verify backend connectivity
echo "🔍 Testing backend connectivity..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$REACT_APP_API_URL/health")

if [ "$response" = "200" ]; then
    echo "✅ Backend is accessible"
else
    echo "⚠️  Backend returned status: $response"
    echo "   Deployment will continue, but backend may not be available"
fi

# List build contents
echo "📦 Build contents:"
ls -la frontend/build/

# Display deployment instructions
echo ""
echo "🌐 Manual Netlify Deployment Instructions:"
echo "1. Go to https://app.netlify.com/drop"
echo "2. Drag and drop the 'frontend/build' folder"
echo "3. Or use Netlify CLI: 'netlify deploy --prod --dir=frontend/build'"
echo ""
echo "📋 Environment Variables to set in Netlify Dashboard:"
echo "   REACT_APP_API_URL: $REACT_APP_API_URL"
echo "   REACT_APP_DEBUG: $REACT_APP_DEBUG"
echo ""
echo "🔧 Netlify Configuration:"
echo "   - Build command: cd frontend && npm run build"
echo "   - Publish directory: frontend/build"
echo "   - Node version: 18"
echo ""

# Validate build includes our fixes
echo "🔍 Validating build includes fixes..."

if grep -q "loopDetection" frontend/build/static/js/*.js; then
    echo "✅ Loop detection code found in build"
else
    echo "⚠️  Loop detection code not found - may need rebuild"
fi

if grep -q "lfa-legacy-go-backend" frontend/build/static/js/*.js; then
    echo "✅ API URL configuration found in build"
else
    echo "⚠️  API URL configuration not found - check environment variables"
fi

echo ""
echo "🎯 Post-Deployment Testing:"
echo "1. Visit deployed URL"
echo "2. Open browser console (F12)"
echo "3. Check for API connectivity logs"
echo "4. Test login flow: Register → Login → Dashboard"
echo "5. Verify no infinite redirects occur"
echo ""
echo "🔧 If issues persist:"
echo "1. Check Netlify build logs"
echo "2. Verify environment variables are set"
echo "3. Test API endpoints directly"
echo "4. Review browser console for errors"
echo ""
echo "✅ Deployment preparation complete!"