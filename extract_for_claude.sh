#!/bin/bash

# OPTIMALIZÁLT CLAUDE TUDÁSTÁR EXTRACTOR
# Csak a kritikus forráskódok - MAX 4MB

OUTPUT_FILE="CLAUDE_AINAK.txt"
MAX_FILE_SIZE=100000  # 100KB per fájl limit

echo "🔍 OPTIMALIZÁLT LFA LEGACY GO TUDÁSTÁR GYŰJTÉS" > "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"
echo "📅 Generálás ideje: $(date)" >> "$OUTPUT_FILE"
echo "🎯 Csak kritikus forráskódok" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Fájlméret ellenőrző függvény
check_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        local size=$(wc -c < "$file")
        if [ $size -gt $MAX_FILE_SIZE ]; then
            echo "⚠️  SKIP: $file (túl nagy: ${size} bytes)" >> "$OUTPUT_FILE"
            return 1
        fi
    fi
    return 0
}

# Fájl hozzáadó függvény
add_file_content() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ] && check_file_size "$file_path"; then
        echo "" >> "$OUTPUT_FILE"
        echo "==== $description ==== ($file_path)" >> "$OUTPUT_FILE"
        cat "$file_path" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
}

# 1. PROJEKT STRUKTURA (csak main directories)
echo "==== PROJEKT FŐKÖNYVTÁR STRUKTÚRA ====" >> "$OUTPUT_FILE"
tree -d -L 3 -I 'node_modules|.git|__pycache__|coverage|test-results|playwright-report|static|build|CLAUDE_AINAK' >> "$OUTPUT_FILE" 2>/dev/null || echo "Tree command not available" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 2. BACKEND CORE FILES
echo "🐍 BACKEND CORE KOMPONENSEK" >> "$OUTPUT_FILE"
echo "==============================" >> "$OUTPUT_FILE"

add_file_content "backend/requirements.txt" "Backend Dependencies"
add_file_content "backend/main.py" "Main Backend Entry Point"
add_file_content "backend/app.py" "Flask App Configuration"

# Backend source fájlok
for file in backend/src/routes/*.py; do
    [ -f "$file" ] && add_file_content "$file" "Backend Route: $(basename "$file")"
done

for file in backend/src/models/*.py; do
    [ -f "$file" ] && add_file_content "$file" "Backend Model: $(basename "$file")"
done

for file in backend/src/services/*.py; do
    [ -f "$file" ] && add_file_content "$file" "Backend Service: $(basename "$file")"
done

for file in backend/src/utils/*.py; do
    [ -f "$file" ] && add_file_content "$file" "Backend Utility: $(basename "$file")"
done

# 3. FRONTEND CORE FILES
echo "⚛️  FRONTEND CORE KOMPONENSEK" >> "$OUTPUT_FILE"
echo "==============================" >> "$OUTPUT_FILE"

add_file_content "frontend/package.json" "Frontend Dependencies"
add_file_content "frontend/src/App.tsx" "Main React App"
add_file_content "frontend/src/index.tsx" "React Entry Point"

# Context fájlok
for file in frontend/src/contexts/*.tsx; do
    [ -f "$file" ] && add_file_content "$file" "React Context: $(basename "$file")"
done

# Main komponensek (csak a kritikusak)
add_file_content "frontend/src/components/auth/AuthForm.tsx" "Auth Component"
add_file_content "frontend/src/components/dashboard/Dashboard.tsx" "Dashboard Component" 
add_file_content "frontend/src/components/layout/Layout.tsx" "Layout Component"

# Pages
for file in frontend/src/pages/*.tsx; do
    [ -f "$file" ] && add_file_content "$file" "Page Component: $(basename "$file")"
done

# Services
for file in frontend/src/services/*.ts; do
    [ -f "$file" ] && add_file_content "$file" "Frontend Service: $(basename "$file")"
done

# 4. KONFIGURÁCIÓ FÁJLOK
echo "⚙️  KRITIKUS KONFIGURÁCIÓK" >> "$OUTPUT_FILE"
echo "===========================" >> "$OUTPUT_FILE"

add_file_content "package.json" "Root Package Config"
add_file_content "docker-compose.yml" "Docker Compose"
add_file_content "Dockerfile" "Docker Configuration"
add_file_content ".env.postgres" "Postgres Environment"
add_file_content "railway.toml" "Railway Config"
add_file_content "netlify.toml" "Netlify Config"

# 5. RECENT DOCUMENTATION (csak a legfontosabbak)
echo "📚 KRITIKUS DOKUMENTÁCIÓ" >> "$OUTPUT_FILE"
echo "========================" >> "$OUTPUT_FILE"

add_file_content "README.md" "Project README"
add_file_content "CLAUDE-CODE-HANDOFF-COMPLETE.md" "Claude Code Handoff"
add_file_content "PRODUCTION_READY_REPORT.md" "Production Status"

# 6. DEPLOYMENT SCRIPTS (csak a kritikusak)
echo "🚀 DEPLOYMENT SZKRIPTEK" >> "$OUTPUT_FILE"
echo "=======================" >> "$OUTPUT_FILE"

add_file_content "start-backend.sh" "Backend Start Script"
add_file_content "start-frontend.sh" "Frontend Start Script"
add_file_content "ULTIMATE_DEPLOY.sh" "Ultimate Deploy Script"

# 7. FÁJL MÉRET ELLENŐRZÉS
echo "" >> "$OUTPUT_FILE"
echo "📊 TUDÁSTÁR STATISZTIKÁK" >> "$OUTPUT_FILE"
echo "========================" >> "$OUTPUT_FILE"
file_size=$(wc -c < "$OUTPUT_FILE")
file_size_mb=$(echo "scale=2; $file_size / 1048576" | bc -l 2>/dev/null || echo "$file_size bytes")
echo "📁 Fájlméret: $file_size_mb MB" >> "$OUTPUT_FILE"
echo "📄 Sorok száma: $(wc -l < "$OUTPUT_FILE")" >> "$OUTPUT_FILE"
echo "🎯 Optimalizálva Claude Code munkához" >> "$OUTPUT_FILE"

echo "✅ OPTIMALIZÁLT TUDÁSTÁR KÉSZ: $OUTPUT_FILE"
echo "📊 Méret: $file_size_mb MB"

# Figyelmeztetés ha túl nagy
if [ $file_size -gt 4000000 ]; then
    echo "⚠️  FIGYELEM: Még mindig nagy a fájl ($file_size_mb MB)"
    echo "   További optimalizálás szükséges!"
fi