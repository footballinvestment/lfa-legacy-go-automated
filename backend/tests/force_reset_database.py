#!/usr/bin/env python3
"""
Force Database Reset Script for LFA Legacy GO
Completely clears and recreates database with force
"""

import sys
import os
import glob

# Add the app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def force_clean_database():
    """Force clean all database files and cache"""
    print("🧹 Force cleaning all database files...")
    
    # Remove all .db files
    db_files = glob.glob("*.db") + glob.glob("app/*.db") + glob.glob("**/*.db", recursive=True)
    for db_file in db_files:
        try:
            os.remove(db_file)
            print(f"   🗑️  Removed: {db_file}")
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"   ⚠️  Could not remove {db_file}: {e}")
    
    # Clear Python cache
    print("🧹 Clearing Python cache...")
    cache_dirs = glob.glob("**/__pycache__", recursive=True)
    for cache_dir in cache_dirs:
        try:
            import shutil
            shutil.rmtree(cache_dir)
            print(f"   🗑️  Removed cache: {cache_dir}")
        except:
            pass

def main():
    print("💪 LFA Legacy GO - FORCE Database Reset Tool")
    print("="*60)
    
    try:
        # Force clean everything
        force_clean_database()
        
        # Import after cleaning
        from app.database import Base, engine
        
        print("🔄 Force recreating database schema...")
        
        # Force drop and recreate
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        print("✅ Force reset completed successfully!")
        print("📊 Fresh database with latest schema")
        print("🎯 You can now restart the backend")
        
    except Exception as e:
        print(f"❌ Force reset failed: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    main()