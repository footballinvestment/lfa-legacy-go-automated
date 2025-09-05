#!/bin/bash
# Complete End-to-End Test Script for LFA Legacy GO

BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
FRONTEND_URL="https://lfa-legacy-go.netlify.app"

echo "🧪 LFA Legacy GO - Complete End-to-End Test"
echo "============================================="

# Test 1: Backend Health
echo "🏥 Testing backend health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
echo "  Response: $HEALTH_RESPONSE"

# Test 2: CORS Verification
echo "🌐 Testing CORS headers..."
CORS_STATUS=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/auth/register" \
    -H "Origin: $FRONTEND_URL" | grep "access-control-allow-origin" || echo "MISSING")
echo "  CORS Status: $CORS_STATUS"

# Test 3: Registration Flow
echo "📝 Testing registration endpoint..."
REG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"username": "e2etest", "email": "e2e@test.com", "password": "testpass", "full_name": "E2E Test User"}')

echo "  Registration Response Keys:"
echo "$REG_RESPONSE" | jq -r 'keys[]' 2>/dev/null || echo "  ERROR: Invalid JSON response"

# Test 4: Login Flow
echo "🔐 Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"username": "e2etest", "password": "testpass"}')

echo "  Login Response Keys:"
echo "$LOGIN_RESPONSE" | jq -r 'keys[]' 2>/dev/null || echo "  ERROR: Invalid JSON response"

# Extract token for next test
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token' 2>/dev/null)

# Test 5: User Profile Endpoint
echo "👤 Testing user profile endpoint..."
PROFILE_RESPONSE=$(curl -s "$BACKEND_URL/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Origin: $FRONTEND_URL")

echo "  Profile Response Keys:"
echo "$PROFILE_RESPONSE" | jq -r 'keys[]' 2>/dev/null || echo "  ERROR: Invalid JSON response"

# Test 6: Frontend Accessibility
echo "🌐 Testing frontend availability..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
echo "  Frontend HTTP Status: $FRONTEND_STATUS"

echo ""
echo "✅ End-to-End Test Complete!"
echo ""
echo "📋 Summary:"
echo "  Backend Health: $(echo $HEALTH_RESPONSE | jq -r '.status' 2>/dev/null || echo 'ERROR')"
echo "  CORS Enabled: $([ "$CORS_STATUS" != "MISSING" ] && echo "✅" || echo "❌")"
echo "  Registration: $(echo $REG_RESPONSE | jq -r '.access_token' 2>/dev/null | head -c 10)..."
echo "  Login Token: $(echo $TOKEN | head -c 10)..."
echo "  Profile Data: $(echo $PROFILE_RESPONSE | jq -r '.username' 2>/dev/null || echo 'ERROR')"
echo "  Frontend: $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ Online" || echo "❌ Offline")"