#!/bin/bash

# ============================================================================
# LFA Legacy GO - END-TO-END TEST RUNNER
# Futtatja a teljes production tesztet Netlify + Google Cloud környezeten
# ============================================================================

echo "🚀 LFA Legacy GO - Production E2E Test Runner"
echo "=============================================="

# 📦 DEPENDENCIES CHECK
echo "📦 Checking dependencies..."

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# 🔧 INSTALL PLAYWRIGHT IF NEEDED
echo "🔧 Setting up Playwright..."

if ! npm list @playwright/test &> /dev/null; then
    echo "📥 Installing Playwright..."
    npm install @playwright/test
fi

echo "🎭 Installing browser binaries..."
npx playwright install chromium

# 📁 CREATE TEST RESULTS DIRECTORY
echo "📁 Creating test results directory..."
mkdir -p test-results

# 🎯 ENVIRONMENT CONFIGURATION
echo "🎯 Configuring test environment..."
export FRONTEND_URL="https://lfa-legacy-go.netlify.app"
export BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
export TEST_USERNAME="testuser"
export TEST_PASSWORD="password123"

echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   User:     $TEST_USERNAME"

# 🧪 QUICK CONNECTIVITY TEST
echo ""
echo "🧪 Quick connectivity test..."

echo "🔍 Testing backend health..."
if curl -s "$BACKEND_URL/health" | grep -q "healthy"; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "⚠️  Continuing with test anyway..."
fi

echo "🔍 Testing frontend..."
if curl -s "$FRONTEND_URL" | grep -q "LFA Legacy GO\|html"; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend check failed"
    echo "⚠️  Continuing with test anyway..."
fi

# 🎬 RUN THE TEST
echo ""
echo "🎬 Starting End-to-End Test..."
echo "=============================================="

# Choose test mode
echo "Select test mode:"
echo "1) 👁️  Headed mode (watch the browser)"
echo "2) 🔍 Debug mode (step-by-step debugging)"  
echo "3) ⚡ Headless mode (fast, background)"
echo "4) 📊 Full report mode (all browsers)"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🎭 Running in headed mode..."
        npx playwright test lfa_production_e2e_test.js --headed --project=chromium
        ;;
    2)
        echo "🔍 Running in debug mode..."
        npx playwright test lfa_production_e2e_test.js --debug --project=chromium
        ;;
    3)
        echo "⚡ Running in headless mode..."
        npx playwright test lfa_production_e2e_test.js --project=chromium
        ;;
    4)
        echo "📊 Running full test suite..."
        npx playwright test lfa_production_e2e_test.js
        ;;
    *)
        echo "⚡ Default: Running in headless mode..."
        npx playwright test lfa_production_e2e_test.js --project=chromium
        ;;
esac

# 📊 RESULTS SUMMARY
echo ""
echo "📊 Test Results Summary"
echo "=============================================="

if [ -d "test-results" ]; then
    echo "📁 Screenshots: $(find test-results -name "*.png" | wc -l) files"
    echo "🎬 Videos: $(find test-results -name "*.webm" | wc -l) files"
    echo "📋 Logs: $(find test-results -name "*.log" | wc -l) files"
    
    echo ""
    echo "📋 Generated files:"
    ls -la test-results/ | grep -E "\.(png|webm|log)$" | head -10
    
    if [ $(ls test-results/ | wc -l) -gt 10 ]; then
        echo "   ... and more files"
    fi
fi

# 🎯 FINAL RECOMMENDATIONS
echo ""
echo "🎯 Next Steps & Recommendations"
echo "=============================================="

if [ -f "test-results/04-post-login.png" ]; then
    echo "✅ Login screenshot found - check if login was successful"
fi

if [ -f "test-results/05-dashboard.png" ]; then
    echo "✅ Dashboard screenshot found - check dashboard functionality"
fi

echo ""
echo "📖 View detailed report:"
echo "   npx playwright show-report"
echo ""
echo "🔍 Debug failed tests:"
echo "   npx playwright test lfa_production_e2e_test.js --debug"
echo ""
echo "📊 View screenshots:"
echo "   open test-results/"
echo ""
echo "🔄 Rerun specific test:"
echo "   npx playwright test lfa_production_e2e_test.js -g 'Login Flow'"

echo ""
echo "🎉 End-to-End Test Completed!"
echo "=============================================="