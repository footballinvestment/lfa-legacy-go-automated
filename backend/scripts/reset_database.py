#!/usr/bin/env python3
"""
Database Reset Script for LFA Legacy GO
Resets the SQLite database with fresh schema
"""

import sys
import os

# Add the app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import reset_database, init_database

def main():
    print("🔄 LFA Legacy GO - Database Reset Tool")
    print("="*50)
    
    try:
        # Reset database (drop all tables and recreate)
        reset_database()
        
        # Initialize with fresh schema
        print("🚀 Initializing fresh database...")
        success = init_database()
        
        if success:
            print("✅ Database reset completed successfully!")
            print("📊 All tables recreated with latest schema")
            print("🎯 You can now restart the backend")
        else:
            print("❌ Database initialization failed!")
            
    except Exception as e:
        print(f"❌ Database reset failed: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    main()