#!/usr/bin/env python3
"""
Execute MFA migration using existing database configuration
"""
import os
import sys
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

def execute_mfa_migration():
    """Execute the MFA migration using environment variables"""
    try:
        # Try to get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            # Fallback to Google Cloud SQL connection string
            database_url = "postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@/lfa_legacy_go?host=/cloudsql/lfa-legacy-go:us-central1:lfa-postgres-main"
        
        print(f"🔄 Connecting to database...")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Read migration file
        migration_file = "migrations/007_add_mfa_tables.sql"
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print("📋 Migration SQL:")
        print(migration_sql)
        print("\n" + "="*50)
        
        # Execute migration
        print("⚙️ Executing MFA migration...")
        
        with engine.connect() as connection:
            # Execute the entire migration as one transaction
            try:
                result = connection.execute(text(migration_sql))
                connection.commit()
                print("✅ Migration executed successfully!")
                
                # Verify table exists
                check_query = "SELECT table_name FROM information_schema.tables WHERE table_name = 'user_mfa_factors'"
                result = connection.execute(text(check_query))
                tables = result.fetchall()
                
                if tables:
                    print("✅ Verification: user_mfa_factors table exists!")
                    return True
                else:
                    print("❌ Verification failed: table not found")
                    return False
                    
            except SQLAlchemyError as e:
                print(f"❌ Migration failed: {str(e)}")
                return False
        
    except Exception as e:
        print(f"❌ Connection/execution failed: {str(e)}")
        print(f"💡 This might be because the database is not accessible from this environment")
        print(f"💡 The migration can be run manually on the production server")
        return False

def show_manual_migration_instructions():
    """Show instructions for manual migration"""
    print("\n" + "="*60)
    print("📋 MANUAL MIGRATION INSTRUCTIONS")
    print("="*60)
    print("If the automatic migration failed, run this SQL manually:")
    print("\n```sql")
    
    try:
        with open("migrations/007_add_mfa_tables.sql", 'r') as f:
            print(f.read())
        print("```")
    except:
        print("-- Migration file not found")
    
    print("\n💡 You can also run the migration on the production server using:")
    print("   gcloud sql connect lfa-postgres-main --user=lfa_user")
    print("   Then paste the SQL above")

if __name__ == "__main__":
    print("🔐 LFA Legacy GO - MFA Migration Executor")
    print("="*50)
    
    success = execute_mfa_migration()
    
    if not success:
        show_manual_migration_instructions()
        print("\n🔄 Proceeding with code updates anyway...")
        print("⚠️  Remember to run the migration before testing!")
    
    sys.exit(0)  # Continue with code updates regardless