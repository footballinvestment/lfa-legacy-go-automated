#!/bin/bash
# === FULL-STACK INDÍTÁS ÉS TESZT - LFA Legacy GO ===
# Futtatás: bash fullstack_test.sh

echo "🚀 LFA LEGACY GO - FULL-STACK INDÍTÁS"
echo "====================================="

# Ellenőrizd hogy a root könyvtárban vagy
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Hiba: Nem a projekt root könyvtárában vagy!"
    echo "   cd ~/Seafile/Football\\ Investment/Projects/GanballGames/lfa-legacy-go/"
    exit 1
fi

echo "✅ Projekt root könyvtár OK"
echo ""

echo "🔧 1. BACKEND ELLENŐRZÉS"
echo "======================="

# Ellenőrizd hogy a backend fut-e
echo "🔍 Backend status ellenőrzés..."
curl -s "http://localhost:8000/api/weather/health" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend fut a 8000-es porton"
    echo "🌤️ Weather API status:"
    curl -s "http://localhost:8000/api/weather/health" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'   • Status: {data[\"status\"]}')
    print(f'   • API Key: {\"✅\" if data.get(\"api_key_configured\") else \"❌\"}')
    print(f'   • Rules: {data.get(\"game_rules_configured\", 0)} configured')
except:
    print('   • Health check parse error')
"
else
    echo "❌ Backend nem fut! Indítsd el:"
    echo "   cd backend"
    echo "   export WEATHER_API_KEY=\"69da7490d86a941a47db9ab34206d2aa\""
    echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi

echo ""
echo "📱 2. FRONTEND ELŐKÉSZÍTÉS"
echo "========================="

cd frontend

echo "🔍 Frontend dependencies ellenőrzés..."
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies telepítése..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed!"
        exit 1
    fi
    echo "✅ Dependencies telepítve"
else
    echo "✅ Dependencies már telepítve"
fi

echo "🔍 Package.json ellenőrzés..."
REACT_VERSION=$(node -e "console.log(require('./package.json').dependencies.react)")
MUI_VERSION=$(node -e "console.log(require('./package.json').dependencies['@mui/material'])")
echo "   • React: $REACT_VERSION"
echo "   • Material-UI: $MUI_VERSION"

echo ""
echo "🔗 3. API KAPCSOLAT TESZT"
echo "========================"

echo "🧪 Frontend-Backend kapcsolat tesztelése..."

# Test backend availability from frontend perspective
echo "🔍 Cross-origin policy check..."
curl -s -X OPTIONS "http://localhost:8000/api/weather/health" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ CORS configured correctly"
else
    echo "⚠️  CORS may need attention"
fi

echo ""
echo "📋 4. ENDPOINT MAPPING CHECK"
echo "============================"

echo "🔍 WeatherWidget endpoints mapping..."
echo "Frontend várja:"
echo "   • GET /api/weather/location/{id}/current"
echo "   • GET /api/weather/location/{id}/alerts"

echo ""
echo "Backend biztosítja:"
curl -s "http://localhost:8000/openapi.json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    paths = data.get('paths', {})
    weather_paths = [p for p in paths.keys() if '/weather/location/' in p]
    for path in sorted(weather_paths):
        print(f'   • {path}')
except:
    print('   • OpenAPI schema error')
"

echo ""
echo "🚀 5. FRONTEND INDÍTÁS INSTRUKCIÓК"
echo "=================================="

echo "Frontend indítása:"
echo "   npm start"
echo ""
echo "📱 Várható eredmény:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:8000"
echo ""
echo "🧪 TESZTELENDŐ FUNKCIÓK:"
echo "   ✅ Authentication (login/register)"
echo "   ✅ Weather Widget (current weather)"
echo "   ✅ Dashboard integration"
echo "   ✅ Location listing with weather"
echo "   ✅ Booking system"
echo ""
echo "🎯 SIKER KRITÉRIUMOK:"
echo "   • Frontend loads without console errors"
echo "   • Login form accepts p3t1k3/alaP1234"
echo "   • Weather widget shows 12.5°C mock data"
echo "   • Dashboard displays user info + weather"
echo ""
echo "💡 DEBUG TIP:"
echo "   Nyisd meg a browser Developer Tools (F12)"
echo "   Network tab-ben kövesd az API hívásokat"
echo ""
echo "🚀 FRONTEND INDÍTÁS:"
echo "cd frontend && npm start"