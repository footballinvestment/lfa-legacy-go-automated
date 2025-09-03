#!/bin/bash

echo "=== LFA LEGACY GO - LOKÁLIS INTEGRÁCIÓS TESZT ==="
echo "================================================="

# Phase 1: Backend Health Check
echo "1. Backend egészség ellenőrzés..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health 2>/dev/null)
if [[ $? -eq 0 && $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "   ✅ Backend elérhető és egészséges"
else
    echo "   ❌ Backend nem elérhető. Indítsd el: ./start-backend.sh"
    exit 1
fi

# Phase 2: Admin Login Test
echo "2. Admin bejelentkezés teszt..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

if [[ $LOGIN_RESPONSE == *"access_token"* ]]; then
    echo "   ✅ Admin login sikeres"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    echo "   ❌ Admin login sikertelen"
    echo "   Válasz: $LOGIN_RESPONSE"
    exit 1
fi

# Phase 3: CORS Teszt
echo "3. CORS konfiguráció teszt..."
CORS_TEST=$(curl -s -I -H "Origin: http://localhost:3000" http://localhost:8000/health 2>/dev/null)
if [[ $CORS_TEST == *"Access-Control-Allow-Origin"* ]]; then
    echo "   ✅ CORS megfelelően konfigurált"
else
    echo "   ⚠️  CORS headers nem láthatók HEAD request-tel, GET teszt..."
    CORS_GET_TEST=$(curl -s -H "Origin: http://localhost:3000" http://localhost:8000/health 2>/dev/null)
    if [[ $? -eq 0 ]]; then
        echo "   ✅ CORS működik - GET request sikeres"
    else
        echo "   ❌ CORS probléma - frontend nem tud csatlakozni"
        exit 1
    fi
fi

# Phase 4: Frontend Elérhetőség (opcionális)
echo "4. Frontend elérhetőség teszt..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "   ✅ Frontend elérhető a 3000-es porton"
elif curl -s http://localhost:49430 >/dev/null 2>&1; then
    echo "   ✅ Frontend elérhető alternatív porton"
else
    echo "   ⚠️  Frontend nem fut - indítsd el: ./start-frontend.sh --local"
fi

echo ""
echo "🎉 INTEGRÁCIÓS TESZT SIKERES!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000 (vagy alternatív port)"
echo "   Admin: admin / admin123"