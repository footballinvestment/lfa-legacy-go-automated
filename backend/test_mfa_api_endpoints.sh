#!/bin/bash

# MFA API Endpoints Test Script
API_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
USERNAME="debugadmin2"
PASSWORD="yourpassword"  # Update this with the actual password

echo "🔐 LFA Legacy GO - MFA API Test"
echo "================================"
echo "API URL: $API_URL"
echo "Test User: $USERNAME"
echo ""

# Step 1: Initial login (should work without MFA)
echo "📋 STEP 1: Testing normal login (no MFA yet)"
echo "curl -X POST \"$API_URL/api/auth/login\" -H \"Content-Type: application/json\" -d '{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}'"

RESPONSE1=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

echo "Response: $RESPONSE1"
echo ""

# Extract token
TOKEN=$(echo "$RESPONSE1" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Login successful - Token obtained"
    echo "Token (first 20 chars): ${TOKEN:0:20}..."
    
    MFA_REQUIRED=$(echo "$RESPONSE1" | grep -o '"mfa_required":[^,}]*' | cut -d':' -f2)
    echo "MFA Required: $MFA_REQUIRED"
    echo ""
    
    # Step 2: Setup MFA
    echo "📋 STEP 2: Setting up MFA"
    echo "curl -X POST \"$API_URL/api/auth/mfa/setup-totp\" -H \"Authorization: Bearer \$TOKEN\""
    
    RESPONSE2=$(curl -s -X POST "$API_URL/api/auth/mfa/setup-totp" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    echo "Response: $RESPONSE2"
    echo ""
    
    if echo "$RESPONSE2" | grep -q "qr_code"; then
        echo "✅ MFA setup successful - QR code generated"
        
        MANUAL_KEY=$(echo "$RESPONSE2" | grep -o '"manual_entry_key":"[^"]*' | cut -d'"' -f4)
        if [ -n "$MANUAL_KEY" ]; then
            echo "📱 Manual entry key: ${MANUAL_KEY:0:16}..."
        fi
        echo ""
        
        # Step 3: Verification (manual step)
        echo "📋 STEP 3: MFA Verification (Manual Step Required)"
        echo "🔸 Please scan the QR code or enter the manual key in your authenticator app"
        echo "🔸 Then run this command with the 6-digit code:"
        echo ""
        echo "curl -X POST \"$API_URL/api/auth/mfa/verify-totp-setup\" \\"
        echo "    -H \"Authorization: Bearer $TOKEN\" \\"
        echo "    -H \"Content-Type: application/json\" \\"
        echo "    -d '{\"code\": \"123456\"}'"
        echo ""
        
        echo "📋 STEP 4: After MFA verification, test login again:"
        echo "curl -X POST \"$API_URL/api/auth/login\" \\"
        echo "    -H \"Content-Type: application/json\" \\"
        echo "    -d '{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}'"
        echo ""
        echo "🔸 Expected: Should return mfa_required=true and token_type='mfa_pending'"
        echo ""
        
        echo "📋 STEP 5: Complete MFA login:"
        echo "curl -X POST \"$API_URL/api/auth/mfa/complete\" \\"
        echo "    -H \"Content-Type: application/json\" \\"
        echo "    -d '{\"access_token\": \"MFA_PENDING_TOKEN\", \"code\": \"654321\"}'"
        echo ""
        
    else
        echo "❌ MFA setup failed"
        echo "Response: $RESPONSE2"
    fi
    
else
    echo "❌ Login failed - No token received"
    echo "Response: $RESPONSE1"
fi

echo "🔍 API STATUS CHECK:"
echo "curl -s \"$API_URL/api/health\" | head -5"
curl -s "$API_URL/api/health" | head -5

echo ""
echo "================================"
echo "🏁 Test completed. Check the responses above."
echo "⚠️  Remember: The database migration must be run before MFA will work properly!"
echo "⚠️  Migration file: migrations/007_add_mfa_tables.sql"