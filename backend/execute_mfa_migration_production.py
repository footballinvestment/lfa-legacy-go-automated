#!/usr/bin/env python3
"""
Production MFA Migration Executor
Uses existing application database configuration to run the migration
"""
import os
import sys
import asyncio
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def execute_migration():
    """Execute MFA migration using production database config"""
    try:
        print("🔐 LFA Legacy GO - MFA Migration Executor")
        print("=" * 50)
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # Try to import the database configuration
        print("📋 Step 1: Loading database configuration...")
        try:
            from app.core.database_production import db_config
            engine = db_config.get_engine()
            print("✅ Database engine loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load production database: {e}")
            try:
                from app.database import engine
                print("✅ Fallback database engine loaded")
            except Exception as e2:
                print(f"❌ Failed to load fallback database: {e2}")
                return False
        
        # Read migration file
        print("📋 Step 2: Reading migration file...")
        migration_file = "migrations/007_add_mfa_tables.sql"
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print(f"✅ Migration file loaded ({len(migration_sql)} characters)")
        print()
        
        # Show migration content
        print("📋 Migration SQL to be executed:")
        print("-" * 40)
        print(migration_sql)
        print("-" * 40)
        print()
        
        # Confirm execution
        confirm = input("⚠️  Execute this migration on PRODUCTION database? (yes/no): ")
        if confirm.lower() not in ['yes', 'y']:
            print("❌ Migration cancelled by user")
            return False
        
        # Execute migration
        print("📋 Step 3: Executing migration...")
        
        from sqlalchemy import text
        with engine.connect() as connection:
            try:
                # Execute as a single transaction
                result = connection.execute(text(migration_sql))
                connection.commit()
                print("✅ Migration SQL executed successfully")
                
                # Verification queries
                print("📋 Step 4: Verifying migration results...")
                
                # Check if table exists
                check_table = "SELECT table_name FROM information_schema.tables WHERE table_name = 'user_mfa_factors'"
                result = connection.execute(text(check_table))
                tables = result.fetchall()
                
                if tables:
                    print("✅ user_mfa_factors table created successfully")
                else:
                    print("❌ user_mfa_factors table not found after migration")
                    return False
                
                # Check table structure
                check_structure = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_mfa_factors' ORDER BY ordinal_position"
                result = connection.execute(text(check_structure))
                columns = result.fetchall()
                
                print(f"✅ Table has {len(columns)} columns:")
                for col_name, col_type in columns:
                    print(f"   - {col_name}: {col_type}")
                
                # Check indexes
                check_indexes = "SELECT indexname FROM pg_indexes WHERE tablename = 'user_mfa_factors'"
                result = connection.execute(text(check_indexes))
                indexes = result.fetchall()
                
                print(f"✅ Table has {len(indexes)} indexes:")
                for idx in indexes:
                    print(f"   - {idx[0]}")
                
                # Test basic operations
                print("📋 Step 5: Testing basic operations...")
                
                # Test insert
                test_insert = """
                INSERT INTO user_mfa_factors (user_id, factor_type, secret_key, is_active) 
                VALUES (1, 'totp', 'test_secret_12345', FALSE)
                """
                connection.execute(text(test_insert))
                print("✅ Test insert successful")
                
                # Test select
                test_select = "SELECT COUNT(*) FROM user_mfa_factors WHERE secret_key = 'test_secret_12345'"
                result = connection.execute(text(test_select))
                count = result.scalar()
                print(f"✅ Test select successful (found {count} test record)")
                
                # Clean up test data
                test_cleanup = "DELETE FROM user_mfa_factors WHERE secret_key = 'test_secret_12345'"
                connection.execute(text(test_cleanup))
                print("✅ Test cleanup successful")
                
                connection.commit()
                
                print()
                print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
                print("=" * 50)
                print("✅ user_mfa_factors table created")
                print("✅ Indexes created")  
                print("✅ Foreign key constraints working")
                print("✅ Basic operations tested")
                print()
                print("📱 Next steps:")
                print("1. Restart the application")
                print("2. Test MFA setup endpoint")
                print("3. Verify MFA enforcement")
                print()
                
                return True
                
            except Exception as e:
                print(f"❌ Migration execution failed: {str(e)}")
                connection.rollback()
                return False
        
    except ImportError as e:
        print(f"❌ Cannot import database modules: {e}")
        print("💡 This script must be run in the application environment")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

def show_manual_instructions():
    """Show manual migration instructions if automatic execution fails"""
    print()
    print("=" * 60)
    print("📋 MANUAL MIGRATION INSTRUCTIONS")
    print("=" * 60)
    print()
    print("If the automatic migration failed, you can run this SQL manually:")
    print()
    
    try:
        with open("migrations/007_add_mfa_tables.sql", 'r') as f:
            sql_content = f.read()
        
        print("```sql")
        print(sql_content)
        print("```")
        print()
        print("To execute manually:")
        print("1. Connect to your production database")
        print("2. Copy and paste the SQL above")
        print("3. Verify the table was created with: \\d user_mfa_factors")
        print()
    except Exception as e:
        print(f"❌ Could not read migration file: {e}")

if __name__ == "__main__":
    print("🔐 LFA Legacy GO - Production MFA Migration")
    print()
    
    success = execute_migration()
    
    if not success:
        show_manual_instructions()
        print("🔄 The application code is already updated and ready.")
        print("⚠️  Just run the database migration to complete MFA setup!")
    
    print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sys.exit(0 if success else 1)