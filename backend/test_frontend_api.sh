#!/bin/bash
ORIGIN="http://localhost:3000"
BASE_URL="http://localhost:8000"

echo "=== FRONTEND API CONNECTIVITY TEST ==="
echo "Testing from Origin: $ORIGIN"
echo "Backend URL: $BASE_URL"
echo ""

# Test 1: Health
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -H "Origin: $ORIGIN" "$BASE_URL/api/health")
if [[ $? -eq 0 ]]; then
    echo "   ✅ Health endpoint reachable"
    echo "   Response: $(echo $HEALTH_RESPONSE | head -c 100)..."
else
    echo "   ❌ Health endpoint failed"
    exit 1
fi
echo ""

# Test 2: Login
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -H "Origin: $ORIGIN" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' "$BASE_URL/api/auth/login")
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ ${#TOKEN} -gt 10 ]; then
    echo "   ✅ Login successful"
    echo "   Token length: ${#TOKEN} characters"
else
    echo "   ❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Authenticated request
echo "3. Testing authenticated endpoint..."
if [ ${#TOKEN} -gt 10 ]; then
    CREDITS_RESPONSE=$(curl -s -H "Origin: $ORIGIN" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/credits/balance")
    if [[ $CREDITS_RESPONSE == *"credits"* ]]; then
        echo "   ✅ Authenticated request successful"
        echo "   Response: $CREDITS_RESPONSE"
    else
        echo "   ❌ Authenticated request failed"
        echo "   Response: $CREDITS_RESPONSE"
        exit 1
    fi
else
    echo "   ❌ No valid token available for testing"
    exit 1
fi
echo ""

# Test 4: CORS Headers verification
echo "4. Testing CORS headers..."
CORS_CHECK=$(curl -s -I -H "Origin: $ORIGIN" "$BASE_URL/api/health" | grep -i "access-control-allow-origin")
if [[ $CORS_CHECK == *"$ORIGIN"* ]]; then
    echo "   ✅ CORS headers correctly configured"
    echo "   Header: $CORS_CHECK"
else
    echo "   ❌ CORS headers missing or incorrect"
    echo "   Headers: $CORS_CHECK"
    exit 1
fi
echo ""

echo "🎉 ALL TESTS PASSED - Frontend-Backend connectivity is working!"
echo ""
echo "Summary:"
echo "- ✅ Backend health check working"  
echo "- ✅ Authentication system working"
echo "- ✅ Authenticated requests working"
echo "- ✅ CORS properly configured for frontend"
echo ""
echo "Frontend at $ORIGIN should be able to communicate with backend successfully."