#!/bin/bash
# frontend_verification.sh

FRONTEND_URL="https://lfa-legacy-go.netlify.app"
BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"

echo "🧪 LFA Legacy GO - Frontend Verification Test"
echo "============================================="

# Test 1: Frontend accessibility
echo "📱 Testing frontend accessibility..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible: HTTP $FRONTEND_STATUS"
fi

# Test 2: Backend MFA endpoints
echo "🔐 Testing MFA endpoints..."
for endpoint in "setup-totp" "verify-totp" "disable" "status"; do
    if [ "$endpoint" = "status" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BACKEND_URL/api/auth/mfa/$endpoint")
    else
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/mfa/$endpoint" -H "Content-Type: application/json" -d '{}')
    fi
    if [ "$STATUS" = "200" ]; then
        echo "✅ /api/auth/mfa/$endpoint: OK"
    else
        echo "❌ /api/auth/mfa/$endpoint: HTTP $STATUS"
    fi
done

# Test 3: Registration flow
echo "👤 Testing registration..."
REG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","email":"test@test.com","password":"test123","full_name":"Test User"}')

if echo "$REG_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    echo "✅ Registration returns access_token"
else
    echo "❌ Registration failed or no access_token"
fi

echo "🎯 Verification completed"

# Test 4: CORS verification
echo "🌐 Testing CORS from frontend domain..."
CORS_TEST=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/auth/register" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" | grep -i "access-control-allow-origin" || echo "CORS_MISSING")

if [ "$CORS_TEST" != "CORS_MISSING" ]; then
    echo "✅ CORS: Working"
else
    echo "❌ CORS: Missing"
fi

echo ""
echo "📋 NEXT STEPS FOR MANUAL VERIFICATION:"
echo "1. Visit: $FRONTEND_URL" 
echo "2. Open browser DevTools (F12) → Console tab"
echo "3. Count console messages in 30 seconds:"
echo "   ✅ Expected: Max 5 messages, no 'useSafeAuth HOOK CALLED'"
echo "   ❌ Problem: 10+ repeated messages or infinite loops"
echo "4. Try registration form - should work without CORS errors"
echo "5. Check 'Setup Two-Factor Authentication' button works"