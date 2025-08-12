#!/bin/bash
# === TÉNYLEGES WEATHER API TESZT - LFA Legacy GO ===
# Futtatás: bash weather_api_test.sh

echo "🌤️ WEATHER API TÉNYLEGES TESZT - LFA Legacy GO"
echo "=============================================="

# Ellenőrizd hogy a backend fut-e
echo "🔍 Backend ellenőrzés..."
curl -s "http://localhost:8000/api/weather/rules/all" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Backend nem fut vagy nem elérhető!"
    echo "   Indítsd el: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi
echo "✅ Backend fut"

# Login hogy legyen token
echo ""
echo "🔐 1. LOGIN (Form-encoded)"
echo "------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=p3t1k3&password=alaP1234")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed, no token received"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo "✅ Login successful, token received"
fi

echo ""

# TESZT 1: Weather Rules (Public)
echo "📝 TESZT 1: Weather Rules (Public)"
echo "----------------------------------"
curl -s "http://localhost:8000/api/weather/rules/all" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Rules found: {data[\"rules_count\"]}')
    for rule in data['rules'][:1]:  # Show first rule only
        print(f'   • {rule[\"game_type\"]}: {rule[\"min_temperature\"]}°C - {rule[\"max_temperature\"]}°C')
except Exception as e:
    print(f'❌ Rules test failed: {e}')
"

echo ""

# TESZT 2: Weather Service Health
echo "📝 TESZT 2: Weather Service Health"
echo "----------------------------------"
curl -s "http://localhost:8000/api/weather/health" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Service Status: {data[\"status\"]}')
    if 'api_service_available' in data:
        print(f'   • API Available: {\"✅\" if data[\"api_service_available\"] else \"❌\"}')
    if 'api_key_configured' in data:
        print(f'   • API Key: {\"✅\" if data[\"api_key_configured\"] else \"❌\"}')
    if 'game_rules_configured' in data:
        print(f'   • Game Rules: {data[\"game_rules_configured\"]} configured')
    if 'recent_weather_readings' in data:
        print(f'   • Recent Readings: {data[\"recent_weather_readings\"]}')
except Exception as e:
    print(f'❌ Health check failed: {e}')
"

echo ""

# TESZT 3: Current Weather (JAVÍTOTT URL)
echo "📝 TESZT 3: Current Weather Location 1"
echo "--------------------------------------"
curl -s "http://localhost:8000/api/weather/location/1/current" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'temperature' in data:
        print(f'✅ Weather: {data[\"temperature\"]}°C, {data[\"condition\"]}, Suitable: {data[\"is_game_suitable\"]}')
        print(f'   • Feels like: {data[\"feels_like\"]}°C, Wind: {data[\"wind_speed\"]} m/s')
        print(f'   • Description: {data[\"description\"]} {data[\"emoji\"]}')
        print(f'   • Updated: {data[\"updated_at\"]}')
    elif 'detail' in data:
        print(f'❌ Error: {data[\"detail\"]}')
    else:
        print(f'❌ Unexpected response: {data}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""

# TESZT 4: Weather Forecast (JAVÍTOTT URL)
echo "📝 TESZT 4: Weather Forecast 24h"
echo "--------------------------------"
curl -s "http://localhost:8000/api/weather/location/1/forecast?hours=24" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'forecasts' in data:
        print(f'✅ Forecast: {len(data[\"forecasts\"])} entries, {data[\"forecast_hours\"]}h ahead')
        if data['forecasts']:
            first = data['forecasts'][0]
            print(f'   • Next: {first.get(\"temperature\", \"N/A\")}°C, {first.get(\"condition\", \"N/A\")}')
            last = data['forecasts'][-1] if len(data['forecasts']) > 1 else first
            print(f'   • Later: {last.get(\"temperature\", \"N/A\")}°C, {last.get(\"condition\", \"N/A\")}')
    elif 'detail' in data:
        print(f'❌ Error: {data[\"detail\"]}')
    else:
        print(f'❌ Unexpected response: {data}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""

# TESZT 5: Game Suitability (JAVÍTOTT URL)
echo "📝 TESZT 5: Game Suitability GAME1"
echo "----------------------------------"
curl -s "http://localhost:8000/api/weather/location/1/game/GAME1/suitability" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'is_suitable' in data:
        print(f'✅ Game suitable: {data[\"is_suitable\"]}')
        print(f'   • Game: {data[\"game_type\"]}, Location: {data[\"location_id\"]}')
        print(f'   • Reason: {data[\"reason\"]}')
        if 'current_weather' in data:
            weather = data['current_weather']
            print(f'   • Weather: {weather.get(\"temperature\")}°C, Wind: {weather.get(\"wind_speed\")} m/s')
    elif 'detail' in data:
        print(f'❌ Error: {data[\"detail\"]}')
    else:
        print(f'❌ Unexpected response: {data}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""

# TESZT 6: Weather Alerts
echo "📝 TESZT 6: Weather Alerts Location 1"
echo "-------------------------------------"
curl -s "http://localhost:8000/api/weather/location/1/alerts" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'alert_count' in data:
        print(f'✅ Alerts: {data[\"alert_count\"]} active alerts')
        if data['alerts']:
            for alert in data['alerts'][:2]:  # Show first 2
                print(f'   • {alert[\"severity\"]}: {alert[\"title\"]}')
        else:
            print('   • No active alerts (expected for good weather)')
    elif 'detail' in data:
        print(f'❌ Error: {data[\"detail\"]}')
    elif 'error' in data:
        print(f'❌ Internal Error: {data[\"message\"]}')
        if 'debug' in data:
            print(f'   • Debug: {data[\"debug\"][\"exception_type\"]}')
    else:
        print(f'❌ Unexpected response: {data}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""

# TESZT 7: Game Suitability GAME2 és GAME3
echo "📝 TESZT 7: Other Game Types"
echo "----------------------------"
for GAME in GAME2 GAME3; do
    echo "Testing $GAME:"
    curl -s "http://localhost:8000/api/weather/location/1/game/$GAME/suitability" \
      -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'is_suitable' in data:
        print(f'   ✅ {data[\"game_type\"]}: suitable={data[\"is_suitable\"]}')
    else:
        print(f'   ❌ {sys.argv[1]}: Error')
except:
    print(f'   ❌ Parse error')
" $GAME
done

echo ""
echo "🎯 WEATHER API TESZT ÖSSZEFOGLALÓ:"
echo "=================================="
echo "• Ha minden ✅ → Weather system működik!"
echo "• Ha ❌ hibák vannak → Fájlok nem frissültek megfelelően"
echo ""
echo "🚀 KÖVETKEZŐ LÉPÉSEK:"
echo "• Ha minden ✅ → Folytathatjuk a frontend teszteléssel"
echo "• Ha ❌ hibák → Frissítsük a fájlokat az artifacts-ból"
echo ""
echo "📋 ARTIFACTS ELÉRÉSE:"
echo "• weather_py_fixed → app/models/weather.py"
echo "• fixed_weather_router → app/routers/weather.py"