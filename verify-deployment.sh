#!/bin/bash
# LFA Legacy GO - Deployment Verification

echo "🔍 LFA Legacy GO - Deployment Verification"
echo "=========================================="

BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
FRONTEND_URL="https://lfa-legacy-go.netlify.app"

# Function for logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Test 1: Backend Health
echo "🏥 Testing backend health..."
curl -s "$BACKEND_URL/health" | jq .

# Test 2: CORS Headers
echo ""
echo "🌐 Testing CORS headers..."
curl -i -X OPTIONS "$BACKEND_URL/api/auth/register" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" 2>/dev/null | grep -i "access-control"

# Test 3: Registration Endpoint
echo ""
echo "📝 Testing registration endpoint..."
curl -s -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"username":"testuser","email":"test@test.com","password":"test123","full_name":"Test User"}' | jq .

# Test 4: Login Endpoint
echo ""
echo "🔐 Testing login endpoint..."
curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"username":"testuser","password":"test123"}' | jq .

# Test 5: Frontend accessibility
echo ""
echo "🌐 Testing frontend availability..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    log "✅ Frontend: Accessible ($FRONTEND_STATUS)"
else
    log "❌ Frontend: Not accessible ($FRONTEND_STATUS)"
fi

echo ""
echo "✅ All endpoint tests completed"
echo ""
echo "📋 Manual Testing Steps:"
echo "1. Visit: $FRONTEND_URL"
echo "2. Open browser DevTools (F12)"
echo "3. Go to Network tab"
echo "4. Try registration form"
echo "5. Verify no CORS errors in console"
echo "6. Check API requests succeed"