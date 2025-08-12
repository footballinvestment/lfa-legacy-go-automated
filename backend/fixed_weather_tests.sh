# === MANUÁLIS FÁJL FRISSÍTÉS ===
# BACKEND könyvtárban vagy már ✅

echo "🔄 WEATHER FÁJLOK FRISSÍTÉSE"
echo "============================"

echo ""
echo "1️⃣ WEATHER MODEL FRISSÍTÉSE:"
echo "   📁 Fájl: app/models/weather.py"
echo "   📋 Artifact: 'weather_py_fixed'"
echo "   🔄 Művelet: Másold ki a teljes tartalmat és írd felül a fájlt"
echo ""

echo "2️⃣ WEATHER ROUTER FRISSÍTÉSE:"
echo "   📁 Fájl: app/routers/weather.py"  
echo "   📋 Artifact: 'fixed_weather_router'"
echo "   🔄 Művelet: Másold ki a teljes tartalmat és írd felül a fájlt"
echo ""

echo "3️⃣ ELLENŐRZÉS:"
echo "   🔍 Ellenőrizd, hogy mindkét fájl frissítve lett"
echo "   📦 Backup már kész: backups/$(ls -t backups/ | head -1)/"
echo ""

echo "4️⃣ BACKEND RESTART API KULCCSAL:"
echo "   ⏹️  CTRL+C (backend leállítása)"
echo "   🔑 export WEATHER_API_KEY=\"69da7490d86a941a47db9ab34206d2aa\""
echo "   🚀 uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""

echo "5️⃣ TESZT FUTTATÁS:"
echo "   🧪 bash fixed_weather_tests.sh"
echo ""

echo "💡 ARTIFACTS TARTALMA:"
echo "   📄 weather_py_fixed: Teljes models/weather.py (to_dict + expires_at)"
echo "   📄 fixed_weather_router: Teljes routers/weather.py (mock API-val)"
echo ""

echo "🎯 VÁRT VÉGEREDMÉNY:"
echo "   ✅ Health: \"status\": \"healthy\""
echo "   ✅ Current Weather: 12.5°C mock adatok"
echo "   ✅ Forecast: Mock előrejelzés"
echo "   ✅ Game Suitability: \"is_suitable\": true"
echo "   ✅ Alerts: \"alert_count\": 0"

echo ""
echo "🚨 FONTOS:"
echo "   - Az artifacts-okban van a teljes fájl tartalom"
echo "   - Claude UI-ban görgess fel és keresd meg a két artifact-et"
echo "   - Másold ki MINDENT és írd felül a teljes fájlokat"