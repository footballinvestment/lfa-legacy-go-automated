#!/bin/bash

echo "🔍 Checking MFA Complete Endpoint Deployment Status"
echo "=================================================="

API_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"

echo "⏰ $(date): Starting deployment check..."

for i in {1..10}; do
    echo "🔄 Attempt $i: Testing /api/auth/mfa/complete endpoint..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/auth/mfa/complete" \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}')
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "Token and code required"; then
        echo "✅ SUCCESS: MFA complete endpoint is working!"
        echo "✅ Endpoint returns 400 'Token and code required' (correct behavior)"
        echo "🎉 Deployment completed successfully!"
        exit 0
    elif echo "$RESPONSE" | grep -q "Not Found"; then
        echo "⏳ Still getting 404 - deployment not complete yet..."
    elif echo "$RESPONSE" | grep -q "Internal Server Error"; then
        echo "⚠️  Getting 500 error - endpoint exists but has runtime issues"
        echo "Response: $RESPONSE"
        exit 1
    else
        echo "🤔 Unexpected response: $RESPONSE"
    fi
    
    echo "   Waiting 30 seconds before next check..."
    sleep 30
done

echo "❌ Deployment check timed out after 10 attempts (5 minutes)"
echo "💡 Manual deployment may be needed"

echo ""
echo "🔧 Manual deployment commands:"
echo "cd /path/to/project && gcloud run deploy lfa-legacy-go-backend --source . --region us-central1"