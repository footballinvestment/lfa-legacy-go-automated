#!/bin/bash
# backend_debug.sh

BACKEND_URL="https://lfa-legacy-go-backend-376491487980.us-central1.run.app"

echo "🔍 Backend Debugging Report"
echo "=========================="

# 1. Basic connectivity
echo "📡 Testing basic connectivity..."
curl -I "$BACKEND_URL" 2>/dev/null | head -1

# 2. Available endpoints discovery
echo "🔍 Testing common endpoints..."
for endpoint in "/health" "/api/health" "/docs" "/openapi.json" "/status"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$endpoint")
    echo "  $endpoint: HTTP $status"
done

# 3. CORS test
echo "🌐 Testing CORS..."
curl -s -I -X OPTIONS "$BACKEND_URL/api/auth/register" \
    -H "Origin: https://lfa-legacy-go.netlify.app" | grep -i "access-control"

echo "✅ Debug completed"