#!/usr/bin/env python3
"""
Run MFA migration (007_add_mfa_tables.sql)
"""
import os
import sys
import asyncio
from sqlalchemy import create_engine, text
from app.core.database_production import db_config

def run_migration():
    """Run the MFA migration"""
    try:
        # Get database engine
        engine = db_config.get_engine()
        
        # Read migration file
        migration_file = "migrations/007_add_mfa_tables.sql"
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        # Execute migration
        print("🔄 Running MFA migration...")
        with engine.connect() as connection:
            # Split and execute each statement
            statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
            
            for statement in statements:
                if statement.strip():
                    print(f"Executing: {statement[:50]}...")
                    connection.execute(text(statement))
            
            connection.commit()
        
        print("✅ MFA migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)