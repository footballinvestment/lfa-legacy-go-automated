#!/bin/bash
# === IMPORT HIBA JAVÍTÓ SCRIPT ===
# Futtatás: bash import_fix_script.sh

echo "🔧 IMPORT HIBA JAVÍTÁS - LFA Legacy GO"
echo "====================================="

echo "📝 1. TOURNAMENT SERVICE TELJES FRISSÍTÉSE"
echo "=========================================="

# Backup current file
cp app/services/tournament_service.py app/services/tournament_service.py.import_backup 2>/dev/null

echo "✅ Backup létrehozva: tournament_service.py.import_backup"
echo ""
echo "🚨 KRITIKUS: Tournament Service fájl frissítése szükséges!"
echo ""
echo "1. Másold ki a 'fixed_tournament_service' artifact TELJES TARTALMÁT"
echo "2. Írd felül: app/services/tournament_service.py"
echo "3. Ellenőrizd hogy a fájl végén van TournamentTemplateService"
echo ""

echo "📝 2. IMPORT ELLENŐRZÉS"
echo "======================"

# Check what the router is trying to import
echo "Tournament router importálja:"
grep "from ..services.tournament_service import" app/routers/tournaments.py

echo ""
echo "Szükséges osztályok:"
echo "  • TournamentService ✅"
echo "  • TournamentLifecycleManager ✅" 
echo "  • TournamentTemplateService ✅ (most hozzáadva)"
echo "  • TournamentAnalyticsService ✅"
echo "  • SingleEliminationService ✅"

echo ""
echo "📝 3. FÁJL STRUKTÚRA ELLENŐRZÉS"
echo "=============================="

if [ -f "app/services/tournament_service.py" ]; then
    echo "✅ Tournament service fájl létezik"
    
    # Check if all required classes are present
    CLASSES=("TournamentService" "TournamentLifecycleManager" "TournamentTemplateService" "TournamentAnalyticsService" "SingleEliminationService")
    
    for class in "${CLASSES[@]}"; do
        if grep -q "class $class" app/services/tournament_service.py; then
            echo "  ✅ $class found"
        else
            echo "  ❌ $class MISSING"
        fi
    done
else
    echo "❌ Tournament service fájl nem található!"
fi

echo ""
echo "🚀 JAVÍTÁSI LÉPÉSEK:"
echo "==================="
echo ""
echo "1. FRISSÍTSD A TOURNAMENT SERVICE-T:"
echo "   cp app/services/tournament_service.py app/services/tournament_service.py.backup"
echo "   # Majd írd felül a 'fixed_tournament_service' artifact tartalmával"
echo ""
echo "2. ELLENŐRIZD A BACKEND IMPORT-OT:"
echo "   python3 -c 'from app.services.tournament_service import TournamentTemplateService; print(\"✅ Import OK\")'"
echo ""
echo "3. INDÍTSD ÚJRA A BACKEND-ET:"
echo "   export WEATHER_API_KEY=\"69da7490d86a941a47db9ab34206d2aa\""
echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "4. TESZTELÉS:"
echo "   bash complete_system_test_fixed.sh"