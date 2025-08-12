#!/usr/bin/env python3
"""
Gyors timezone fix a booking.py fájlban
"""

import os

# A javítandó fájl elérési útja
booking_file = "backend/app/routers/booking.py"

if os.path.exists(booking_file):
    print("📁 Booking.py fájl megtalálva!")
    
    # Beolvassa a fájlt
    with open(booking_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Cserélje ki a problémás sort
    old_line = "if start_time <= datetime.now():"
    new_line = "if start_time <= datetime.now(timezone.utc):"
    
    if old_line in content:
        print("🔧 Javítja a timezone problémát...")
        content = content.replace(old_line, new_line)
        
        # Írja vissza a fájlt
        with open(booking_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Timezone fix kész!")
        print("🚀 Most restart-eld a backend szervert!")
    else:
        print("ℹ️  A problémás sor nem található - lehet már javítva van")
        
        # Keress más problémás helyeket
        if "datetime.now()" in content and "timezone.utc" not in content:
            print("⚠️  Más datetime.now() használat található!")
    
else:
    print("❌ Booking.py fájl nem található!")
    print("Ellenőrizd az elérési utat!")