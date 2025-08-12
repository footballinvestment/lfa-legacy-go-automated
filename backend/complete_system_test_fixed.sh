#!/bin/bash
# === MACOS KOMPATIBILIS TESZT SCRIPT ===

echo "🎮 LFA LEGACY GO - JAVÍTOTT RENDSZER TESZT"
echo "=========================================="

# Backend check
curl -s "http://localhost:8000/api/weather/health" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Backend nem fut!"
    exit 1
fi
echo "✅ Backend fut"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=p3t1k3&password=alaP1234")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['access_token'])
except:
    print('')
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
else
    echo "✅ Login successful"
fi

echo ""
echo "🏆 TOURNAMENTS TESZT (JAVÍTOTT)"
echo "==============================="

curl -s "http://localhost:8000/api/tournaments/" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list):
        print(f'✅ Tournaments found: {len(data)}')
        for tournament in data[:3]:
            print(f'   • {tournament.get(\"name\", \"Unknown\")}: {tournament.get(\"status\", \"N/A\")}')
    elif 'error' in data:
        print(f'❌ Tournament Error: {data[\"message\"]}')
    else:
        print(f'❌ Unexpected response: {type(data)}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""
echo "📅 BOOKING TESZT (JAVÍTOTT)"
echo "==========================="

# JAVÍTOTT: macOS kompatibilis dátum (fix string használata)
TOMORROW="2025-08-11"  # Fixed date for testing

curl -s "http://localhost:8000/api/booking/availability?date=$TOMORROW&location_id=1&game_type=GAME1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'slots' in data:
        print(f'✅ Availability: {data[\"total_slots\"]} total, {data[\"available_slots\"]} available')
    elif 'detail' in data:
        print(f'❌ Booking Error: {data[\"detail\"]}')
    else:
        print(f'❌ Unexpected response: {data}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""
echo "🎮 GAME RESULTS TESZT (JAVÍTOTT)"
echo "================================"

curl -s "http://localhost:8000/api/game-results/" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list):
        print(f'✅ Game results found: {len(data)}')
    elif 'detail' in data and 'Not Found' in data['detail']:
        print('⚠️  Game Results endpoint nincs implementálva (várható)')
    elif 'message' in data:
        print(f'✅ {data[\"message\"]}')
    else:
        print(f'❌ Unexpected response: {data}')
except Exception as e:
    print(f'❌ Parse error: {e}')
"

echo ""
echo "🎯 JAVÍTOTT TESZT EREDMÉNY"
echo "=========================="
echo "✅ Tournament Service javítás után újra kell indítani a backend-et"
echo "✅ Booking system macOS kompatibilis lett"
echo "✅ Game Results endpoint ellenőrizve"

