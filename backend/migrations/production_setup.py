#!/usr/bin/env python3
"""
Production Database Migration Script
Migrates SQLite data to PostgreSQL for production deployment
"""

import os
import sys
import sqlite3
import psycopg2
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from datetime import datetime
import json

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base
from app.models import *

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProductionMigrator:
    def __init__(self, sqlite_path: str, postgres_url: str):
        self.sqlite_path = sqlite_path
        self.postgres_url = postgres_url
        self.migration_log = []
        
    def log_action(self, action: str, details: str = None):
        """Log migration actions"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'details': details
        }
        self.migration_log.append(log_entry)
        logger.info(f"{action}: {details}" if details else action)
    
    def validate_connections(self) -> bool:
        """Validate both database connections"""
        try:
            # Test SQLite connection
            sqlite_conn = sqlite3.connect(self.sqlite_path)
            sqlite_conn.execute("SELECT 1")
            sqlite_conn.close()
            self.log_action("SQLite connection validated")
            
            # Test PostgreSQL connection
            postgres_engine = create_engine(self.postgres_url)
            with postgres_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            postgres_engine.dispose()
            self.log_action("PostgreSQL connection validated")
            
            return True
        except Exception as e:
            self.log_action("Connection validation failed", str(e))
            return False
    
    def export_sqlite_data(self) -> dict:
        """Export all data from SQLite"""
        self.log_action("Starting SQLite data export")
        
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        cursor = conn.cursor()
        
        data = {}
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        for table in tables:
            if table == 'sqlite_sequence':
                continue
                
            self.log_action(f"Exporting table: {table}")
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            # Convert rows to dictionaries
            data[table] = [dict(row) for row in rows]
            self.log_action(f"Exported {len(rows)} rows from {table}")
        
        conn.close()
        self.log_action("SQLite data export completed")
        return data
    
    def create_postgres_schema(self):
        """Create PostgreSQL schema"""
        self.log_action("Creating PostgreSQL schema")
        
        postgres_engine = create_engine(self.postgres_url)
        
        # Create all tables
        Base.metadata.create_all(bind=postgres_engine)
        
        # Add PostgreSQL specific optimizations
        with postgres_engine.connect() as conn:
            # Create indexes for performance
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
                "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)", 
                "CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)",
                "CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id)",
                "CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_game_results_tournament_id ON game_results(tournament_id)",
                "CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id)"
            ]
            
            for index_sql in indexes:
                try:
                    conn.execute(text(index_sql))
                    conn.commit()
                    self.log_action(f"Created index: {index_sql.split()[5]}")
                except Exception as e:
                    self.log_action(f"Index creation warning: {str(e)}")
        
        postgres_engine.dispose()
        self.log_action("PostgreSQL schema creation completed")
    
    def import_postgres_data(self, data: dict):
        """Import data into PostgreSQL"""
        self.log_action("Starting PostgreSQL data import")
        
        postgres_engine = create_engine(self.postgres_url)
        Session = sessionmaker(bind=postgres_engine)
        session = Session()
        
        # Define import order to handle foreign key constraints
        import_order = [
            'users',
            'user_sessions', 
            'locations',
            'location_types',
            'game_definitions',
            'tournaments',
            'tournament_participants',
            'game_sessions',
            'game_results',
            'friendships',
            'friend_requests',
            'user_blocks',
            'challenges',
            'coupons',
            'coupon_usage'
        ]
        
        try:
            for table in import_order:
                if table in data and data[table]:
                    self.log_action(f"Importing {len(data[table])} rows into {table}")
                    
                    # Use raw SQL for faster bulk inserts
                    if data[table]:
                        columns = list(data[table][0].keys())
                        placeholders = ', '.join([f":{col}" for col in columns])
                        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
                        
                        session.execute(text(sql), data[table])
                        session.commit()
                        self.log_action(f"Successfully imported {table}")
            
            self.log_action("PostgreSQL data import completed")
            
        except Exception as e:
            session.rollback()
            self.log_action("Data import failed", str(e))
            raise
        finally:
            session.close()
            postgres_engine.dispose()
    
    def validate_migration(self, original_data: dict) -> bool:
        """Validate that migration was successful"""
        self.log_action("Starting migration validation")
        
        postgres_engine = create_engine(self.postgres_url)
        
        try:
            with postgres_engine.connect() as conn:
                for table, rows in original_data.items():
                    if table == 'sqlite_sequence':
                        continue
                        
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    
                    expected_count = len(rows)
                    if count != expected_count:
                        self.log_action(
                            f"Validation failed for {table}",
                            f"Expected {expected_count}, got {count}"
                        )
                        return False
                    else:
                        self.log_action(f"Validation passed for {table}: {count} rows")
            
            self.log_action("Migration validation completed successfully")
            return True
            
        except Exception as e:
            self.log_action("Migration validation failed", str(e))
            return False
        finally:
            postgres_engine.dispose()
    
    def save_migration_log(self):
        """Save migration log to file"""
        log_file = f"migration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump(self.migration_log, f, indent=2)
        
        self.log_action(f"Migration log saved to {log_file}")
    
    def migrate(self) -> bool:
        """Run complete migration process"""
        self.log_action("=== STARTING PRODUCTION MIGRATION ===")
        
        try:
            # Step 1: Validate connections
            if not self.validate_connections():
                return False
            
            # Step 2: Export SQLite data
            data = self.export_sqlite_data()
            
            # Step 3: Create PostgreSQL schema
            self.create_postgres_schema()
            
            # Step 4: Import data
            self.import_postgres_data(data)
            
            # Step 5: Validate migration
            if not self.validate_migration(data):
                return False
            
            # Step 6: Save log
            self.save_migration_log()
            
            self.log_action("=== MIGRATION COMPLETED SUCCESSFULLY ===")
            return True
            
        except Exception as e:
            self.log_action("=== MIGRATION FAILED ===", str(e))
            self.save_migration_log()
            return False

def main():
    """Main migration function"""
    # Configuration
    sqlite_path = os.getenv("SQLITE_PATH", "./lfa_legacy_go.db")
    postgres_url = os.getenv("POSTGRES_URL")
    
    if not postgres_url:
        print("❌ POSTGRES_URL environment variable is required")
        print("Example: postgresql://user:password@host:port/database")
        return False
    
    print("🚀 LFA Legacy GO - Production Database Migration")
    print(f"SQLite source: {sqlite_path}")
    print(f"PostgreSQL target: {postgres_url.split('@')[1] if '@' in postgres_url else postgres_url}")
    print()
    
    # Confirm migration
    confirm = input("Do you want to proceed with migration? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Migration cancelled")
        return False
    
    # Run migration
    migrator = ProductionMigrator(sqlite_path, postgres_url)
    success = migrator.migrate()
    
    if success:
        print("✅ Migration completed successfully!")
        print("🔥 Production database is ready!")
    else:
        print("❌ Migration failed!")
        print("Check migration log for details")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)