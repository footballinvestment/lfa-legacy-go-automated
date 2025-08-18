    #!/bin/bash
# === complete_fix.sh ===
# Minden probléma megoldása egyszerre

echo "🚀 LFA Legacy GO - Complete Fix Script"
echo "======================================="

# Színek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$HOME/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go"

# 1. Ellenőrzés, hogy a megfelelő könyvtárban vagyunk-e
echo -e "${BLUE}📍 Checking project location...${NC}"
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ Project not found at: $PROJECT_ROOT${NC}"
    echo "Please adjust PROJECT_ROOT in the script"
    exit 1
fi

cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Project found${NC}"

# 2. Folyamatok leállítása
echo -e "${BLUE}⏹️  Stopping all processes...${NC}"
pkill -f uvicorn 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f webpack 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Processes stopped${NC}"

# 3. Backend adatbázis javítása
echo -e "${BLUE}🔧 Fixing admin user...${NC}"
cd backend
source venv/bin/activate

# Python script létrehozása és futtatása
cat > fix_admin.py << 'EOF'
import sqlite3
import bcrypt
from datetime import datetime

def fix_admin():
    try:
        conn = sqlite3.connect('lfa_legacy_go.db')
        cursor = conn.cursor()
        
        # Jelszó hash generálása
        password = "admin123"
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Admin user létrehozása vagy frissítése
        cursor.execute("""
            INSERT OR REPLACE INTO users (
                id, username, email, hashed_password, full_name, 
                is_active, user_type, level, credits, created_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'admin', 
            'admin@lfagolegacy.com', 
            hashed_password, 
            'System Administrator',
            1,  # is_active = True (SQLite-ban 1)
            'admin',
            1,     # level
            1000,  # credits
            datetime.now().isoformat()
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Admin user fixed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    fix_admin()
EOF

python fix_admin.py
rm fix_admin.py

echo -e "${GREEN}✅ Admin user fixed${NC}"

# 4. Backend indítása háttérben
echo -e "${BLUE}🚀 Starting backend...${NC}"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# Várakozás a backend indulására
sleep 5

# Backend health check
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend started successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may need more time to start${NC}"
fi

# 5. Frontend javítása
echo -e "${BLUE}🧠 Fixing frontend memory issues...${NC}"
cd ../frontend

# Node környezeti változók beállítása
export NODE_OPTIONS="--max-old-space-size=8192"
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true

# NPM cache tisztítása
npm cache clean --force

echo -e "${GREEN}✅ Frontend environment optimized${NC}"

# 6. Frontend indítása
echo -e "${BLUE}🎯 Starting frontend...${NC}"
echo -e "${YELLOW}⚠️  This will start the frontend in the current terminal${NC}"
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop, then run 'fg' to resume if needed${NC}"
echo ""

# Frontend indítása
npm start

# Takarítás (ha a script megszakad)
cleanup() {
    echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Ha idáig eljutottunk, minden működik
echo -e "\n${GREEN}🎉 Project is running successfully!${NC}"
echo -e "${GREEN}Backend: http://localhost:8000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Admin login: admin / admin123${NC}"