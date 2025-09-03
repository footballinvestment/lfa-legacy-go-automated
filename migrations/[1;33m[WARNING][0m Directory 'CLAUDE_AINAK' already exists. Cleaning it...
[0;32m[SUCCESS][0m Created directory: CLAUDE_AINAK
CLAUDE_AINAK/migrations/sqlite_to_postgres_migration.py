"""
LFA Legacy GO - SQLite to PostgreSQL Migration
Execute: python migrations/sqlite_to_postgres_migration.py
"""

import os
import sys
import sqlite3
import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.orm import sessionmaker
from sqlalchemy.types import String, Integer, DateTime, Boolean, Text, Float
import logging
from datetime import datetime
from typing import Dict, List
import json

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PostgreSQLMigration:
    def __init__(self):
        # SQLite database path
        self.sqlite_path = "backend/lfa_legacy_go.db"
        
        # Load PostgreSQL credentials from .env.postgres
        self.load_postgres_credentials()
        
        self.sqlite_engine = None
        self.postgres_engine = None
        
    def load_postgres_credentials(self):
        """Load PostgreSQL credentials from .env.postgres file"""
        env_file = ".env.postgres"
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
                        
        # PostgreSQL connection from environment
        self.postgres_url = os.getenv("DATABASE_URL", 
            "postgresql://lfa_user:password@localhost:5433/lfa_legacy_go")
        logger.info(f"Using PostgreSQL URL: {self.postgres_url.replace(':password', ':***')}")
    
    def setup_connections(self):
        """Setup database connections"""
        try:
            # SQLite connection
            if not os.path.exists(self.sqlite_path):
                logger.error(f"SQLite database not found: {self.sqlite_path}")
                return False
                
            self.sqlite_engine = create_engine(f"sqlite:///{self.sqlite_path}")
            logger.info("✅ SQLite connection established")
            
            # PostgreSQL connection with optimized settings
            self.postgres_engine = create_engine(
                self.postgres_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False
            )
            
            # Test PostgreSQL connection
            with self.postgres_engine.connect() as conn:
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                logger.info(f"✅ PostgreSQL connection established: {version[:50]}...")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection setup failed: {e}")
            return False

    def get_table_names(self) -> List[str]:
        """Get all table names from SQLite"""
        try:
            with self.sqlite_engine.connect() as conn:
                result = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ))
                tables = [row[0] for row in result.fetchall()]
                logger.info(f"📋 Found tables: {tables}")
                return tables
        except Exception as e:
            logger.error(f"❌ Failed to get table names: {e}")
            return []

    def create_postgres_schema(self, tables: List[str]):
        """Create PostgreSQL schema from SQLite"""
        try:
            # Use SQLAlchemy metadata to reflect and create schema
            sqlite_metadata = MetaData()
            sqlite_metadata.reflect(bind=self.sqlite_engine)
            
            # Create tables in PostgreSQL
            sqlite_metadata.create_all(self.postgres_engine)
            logger.info("✅ PostgreSQL schema created")
            
        except Exception as e:
            logger.error(f"❌ Schema creation failed: {e}")
            # Continue anyway - might be acceptable if tables already exist
            logger.warning("⚠️  Schema creation failed, but continuing with data migration...")

    def get_table_row_count(self, engine, table_name: str) -> int:
        """Get row count for a table"""
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                return result.fetchone()[0]
        except Exception as e:
            logger.error(f"Failed to get row count for {table_name}: {e}")
            return -1

    def migrate_table_data(self, table_name: str) -> bool:
        """Migrate data for a specific table"""
        try:
            logger.info(f"🔄 Migrating table: {table_name}")
            
            # Check if table already has data in PostgreSQL
            postgres_count = self.get_table_row_count(self.postgres_engine, table_name)
            if postgres_count > 0:
                logger.warning(f"⚠️  Table {table_name} already has {postgres_count} rows in PostgreSQL")
                
                # Ask user if they want to continue
                response = input(f"Table {table_name} already has data. Clear and re-migrate? (y/n): ")
                if response.lower() == 'y':
                    with self.postgres_engine.connect() as conn:
                        conn.execute(text(f"DELETE FROM {table_name}"))
                        conn.commit()
                        logger.info(f"✅ Cleared existing data from {table_name}")
                else:
                    logger.info(f"⏭️  Skipping {table_name}")
                    return True
            
            # Read from SQLite
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", self.sqlite_engine)
            row_count = len(df)
            
            if row_count == 0:
                logger.info(f"📝 Table {table_name} is empty, skipping")
                return True
            
            # Handle datetime columns for PostgreSQL compatibility
            for col in df.columns:
                if df[col].dtype == 'object':
                    # Try to convert datetime strings
                    try:
                        # Check if it looks like a datetime
                        sample_val = df[col].dropna().iloc[0] if len(df[col].dropna()) > 0 else None
                        if sample_val and isinstance(sample_val, str):
                            if any(char in str(sample_val) for char in ['-', ':', 'T', ' ']):
                                # Attempt datetime conversion
                                df[col] = pd.to_datetime(df[col], errors='ignore')
                                logger.info(f"  Converted {col} to datetime")
                    except Exception as e:
                        logger.debug(f"  Could not convert {col} to datetime: {e}")
                        pass
            
            # Write to PostgreSQL with conflict handling
            df.to_sql(
                table_name, 
                self.postgres_engine, 
                if_exists='append',
                index=False,
                method='multi',
                chunksize=1000
            )
            
            logger.info(f"✅ Migrated {row_count} rows to {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to migrate {table_name}: {e}")
            logger.error(f"   Error details: {str(e)[:200]}")
            return False

    def verify_migration(self, tables: List[str]) -> Dict[str, Dict]:
        """Verify migration by comparing row counts"""
        verification_results = {}
        
        for table_name in tables:
            try:
                # SQLite count
                sqlite_count = self.get_table_row_count(self.sqlite_engine, table_name)
                
                # PostgreSQL count
                postgres_count = self.get_table_row_count(self.postgres_engine, table_name)
                
                match = sqlite_count == postgres_count
                verification_results[table_name] = {
                    'sqlite_count': sqlite_count,
                    'postgres_count': postgres_count,
                    'match': match
                }
                
                status = "✅" if match else "❌"
                logger.info(f"{status} {table_name}: SQLite={sqlite_count}, PostgreSQL={postgres_count}")
                
            except Exception as e:
                logger.error(f"❌ Verification failed for {table_name}: {e}")
                verification_results[table_name] = {
                    'sqlite_count': -1,
                    'postgres_count': -1,
                    'match': False,
                    'error': str(e)
                }
    
        return verification_results

    def optimize_postgres_performance(self):
        """Apply PostgreSQL-specific optimizations"""
        try:
            with self.postgres_engine.connect() as conn:
                # Create optimized indexes
                optimization_queries = [
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users USING btree(username)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users USING btree(email)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_status ON tournaments USING btree(status)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_created_at ON tournaments USING btree(created_at)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_user_id ON game_sessions USING btree(user_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_created_at ON game_sessions USING btree(created_at)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_results_user_id ON game_results USING btree(user_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_results_session_id ON game_results USING btree(session_id)",
                    
                    # Update table statistics
                    "ANALYZE users",
                    "ANALYZE tournaments", 
                    "ANALYZE game_sessions",
                    "ANALYZE game_results",
                    "ANALYZE locations",
                    "ANALYZE coupons",
                    "ANALYZE friendships",
                ]
                
                for query in optimization_queries:
                    try:
                        conn.execute(text(query))
                        conn.commit()
                        logger.info(f"✅ Executed: {query[:50]}...")
                    except Exception as e:
                        logger.warning(f"⚠️  Query failed (may be normal): {query[:30]}... - {e}")
                
                logger.info("✅ PostgreSQL optimizations applied")
                
        except Exception as e:
            logger.error(f"❌ Optimization failed: {e}")

    def generate_migration_report(self, verification_results: Dict):
        """Generate a migration report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"migration_report_{timestamp}.json"
        
        report = {
            "migration_timestamp": timestamp,
            "source": "SQLite",
            "destination": "PostgreSQL", 
            "tables": verification_results,
            "summary": {
                "total_tables": len(verification_results),
                "successful_tables": sum(1 for r in verification_results.values() if r.get('match', False)),
                "failed_tables": sum(1 for r in verification_results.values() if not r.get('match', False)),
                "total_rows_migrated": sum(r.get('postgres_count', 0) for r in verification_results.values() if r.get('postgres_count', 0) > 0)
            }
        }
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📊 Migration report saved: {report_file}")
        return report

    def run_migration(self):
        """Execute the complete migration process"""
        logger.info("🚀 Starting SQLite to PostgreSQL migration...")
        
        # Setup connections
        if not self.setup_connections():
            return False
        
        # Get tables
        tables = self.get_table_names()
        if not tables:
            logger.error("❌ No tables found")
            return False
        
        logger.info(f"📋 Tables to migrate: {len(tables)}")
        
        # Create PostgreSQL schema
        self.create_postgres_schema(tables)
        
        # Migrate data
        failed_tables = []
        for table_name in tables:
            if not self.migrate_table_data(table_name):
                failed_tables.append(table_name)
        
        # Verify migration
        verification_results = self.verify_migration(tables)
        failed_verifications = [table for table, result in verification_results.items() 
                              if not result.get('match', False)]
        
        # Generate report
        report = self.generate_migration_report(verification_results)
        
        # Apply optimizations
        self.optimize_postgres_performance()
        
        # Summary
        if failed_tables:
            logger.error(f"❌ Failed to migrate tables: {failed_tables}")
        
        if failed_verifications:
            logger.error(f"❌ Verification failed for tables: {failed_verifications}")
        
        success = len(failed_tables) == 0 and len(failed_verifications) == 0
        
        if success:
            logger.info("🎉 Migration completed successfully!")
            logger.info(f"📊 Summary:")
            logger.info(f"   - Tables migrated: {report['summary']['successful_tables']}/{report['summary']['total_tables']}")
            logger.info(f"   - Total rows: {report['summary']['total_rows_migrated']}")
            logger.info("🔄 Next steps:")
            logger.info("   1. Update backend configuration to use PostgreSQL")
            logger.info("   2. Test API endpoints")  
            logger.info("   3. Run performance tests")
            logger.info("   4. Deploy to production")
        else:
            logger.error("❌ Migration completed with errors!")
            
        return success

def main():
    """Main migration execution"""
    migration = PostgreSQLMigration()
    
    # Create backup timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    logger.info(f"📅 Migration started at: {timestamp}")
    
    # Run migration
    success = migration.run_migration()
    
    if success:
        logger.info("✅ PostgreSQL migration completed successfully!")
    else:
        logger.error("❌ Migration failed! Check logs above")
        sys.exit(1)

if __name__ == "__main__":
    main()