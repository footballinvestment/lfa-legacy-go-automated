"""
Migrate data from SQLite to PostgreSQL
Simple and reliable data migration script
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
import sqlite3
import psycopg2
from sqlalchemy import create_engine, text
import pandas as pd
from datetime import datetime

# Load environment variables
def load_postgres_credentials():
    """Load PostgreSQL credentials from .env.postgres file"""
    env_file = "../.env.postgres"
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_postgres_credentials()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataMigration:
    def __init__(self):
        self.sqlite_path = "lfa_legacy_go.db"
        self.postgres_url = os.getenv("DATABASE_URL", "postgresql://lfa_user:password@localhost:5433/lfa_legacy_go")
        self.sqlite_engine = None
        self.postgres_engine = None
        
    def setup_connections(self):
        """Setup database connections"""
        try:
            # SQLite connection
            if not os.path.exists(self.sqlite_path):
                logger.error(f"SQLite database not found: {self.sqlite_path}")
                return False
                
            self.sqlite_engine = create_engine(f"sqlite:///{self.sqlite_path}")
            logger.info("✅ SQLite connection established")
            
            # PostgreSQL connection
            self.postgres_engine = create_engine(
                self.postgres_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                echo=False
            )
            
            # Test PostgreSQL connection
            with self.postgres_engine.connect() as conn:
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                logger.info(f"✅ PostgreSQL connection established")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection setup failed: {e}")
            return False

    def get_table_names(self):
        """Get all table names from SQLite"""
        try:
            with self.sqlite_engine.connect() as conn:
                result = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ))
                tables = [row[0] for row in result.fetchall()]
                logger.info(f"📋 Found {len(tables)} tables: {tables}")
                return tables
        except Exception as e:
            logger.error(f"❌ Failed to get table names: {e}")
            return []

    def get_table_row_count(self, engine, table_name):
        """Get row count for a table"""
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                return result.fetchone()[0]
        except Exception as e:
            logger.warning(f"Failed to get row count for {table_name}: {e}")
            return 0

    def migrate_table_data(self, table_name):
        """Migrate data for a specific table"""
        try:
            logger.info(f"🔄 Migrating table: {table_name}")
            
            # Check SQLite row count
            sqlite_count = self.get_table_row_count(self.sqlite_engine, table_name)
            if sqlite_count == 0:
                logger.info(f"📝 Table {table_name} is empty in SQLite, skipping")
                return True
            
            # Check if table exists in PostgreSQL
            with self.postgres_engine.connect() as conn:
                try:
                    postgres_count = self.get_table_row_count(self.postgres_engine, table_name)
                    logger.info(f"📊 {table_name}: SQLite={sqlite_count} rows, PostgreSQL={postgres_count} rows")
                    
                    if postgres_count > 0:
                        logger.warning(f"⚠️  Table {table_name} already has {postgres_count} rows in PostgreSQL")
                        response = input(f"Clear and re-migrate {table_name}? (y/n): ")
                        if response.lower() == 'y':
                            conn.execute(text(f"DELETE FROM {table_name}"))
                            conn.commit()
                            logger.info(f"✅ Cleared existing data from {table_name}")
                        else:
                            logger.info(f"⏭️  Skipping {table_name}")
                            return True
                except Exception as e:
                    logger.error(f"❌ Table {table_name} does not exist in PostgreSQL: {e}")
                    return False
            
            # Read data from SQLite
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", self.sqlite_engine)
            
            # Clean the data for PostgreSQL compatibility
            df = self.clean_dataframe_for_postgres(df)
            
            # Write to PostgreSQL in chunks
            chunk_size = 1000
            total_rows = len(df)
            
            for i in range(0, total_rows, chunk_size):
                chunk = df.iloc[i:i + chunk_size]
                chunk.to_sql(
                    table_name, 
                    self.postgres_engine, 
                    if_exists='append',
                    index=False,
                    method='multi'
                )
                logger.info(f"  📦 Migrated rows {i+1}-{min(i+chunk_size, total_rows)} of {total_rows}")
            
            # Verify migration
            final_count = self.get_table_row_count(self.postgres_engine, table_name)
            if final_count == sqlite_count:
                logger.info(f"✅ Successfully migrated {final_count} rows to {table_name}")
                return True
            else:
                logger.error(f"❌ Row count mismatch for {table_name}: SQLite={sqlite_count}, PostgreSQL={final_count}")
                return False
            
        except Exception as e:
            logger.error(f"❌ Failed to migrate {table_name}: {e}")
            return False

    def clean_dataframe_for_postgres(self, df):
        """Clean dataframe for PostgreSQL compatibility"""
        # Handle datetime columns
        for col in df.columns:
            if df[col].dtype == 'object':
                # Try to convert datetime strings
                sample_vals = df[col].dropna().head(5).tolist()
                if sample_vals:
                    for sample_val in sample_vals:
                        if isinstance(sample_val, str):
                            # Check if it looks like a datetime
                            if any(char in str(sample_val) for char in ['-', ':', 'T', ' ']):
                                try:
                                    # Attempt datetime conversion
                                    df[col] = pd.to_datetime(df[col], errors='coerce')
                                    logger.info(f"  📅 Converted {col} to datetime")
                                    break
                                except:
                                    pass
                            break
        
        # Handle JSON columns - ensure they're proper JSON strings
        json_like_columns = ['best_scores', 'skill_ratings', 'skills', 'notification_preferences', 
                            'privacy_settings', 'facilities', 'contact_info', 'operating_hours', 
                            'rules', 'equipment_needed', 'performance_metrics', 'achievements',
                            'challenge_data', 'result_data', 'criteria']
        
        for col in json_like_columns:
            if col in df.columns:
                # Convert to string if not already
                df[col] = df[col].astype(str)
                # Replace empty strings and 'None' with null
                df[col] = df[col].replace(['', 'None', 'null'], None)
        
        return df

    def run_migration(self):
        """Execute the complete migration process"""
        logger.info("🚀 Starting data migration from SQLite to PostgreSQL...")
        
        # Setup connections
        if not self.setup_connections():
            return False
        
        # Get tables from SQLite
        tables = self.get_table_names()
        if not tables:
            logger.error("❌ No tables found in SQLite")
            return False
        
        # Migrate tables in dependency order (approximate)
        table_order = [
            'users', 'user_sessions', 'locations', 'game_definitions', 
            'tournaments', 'tournament_participants', 'game_sessions',
            'game_results', 'friendships', 'friend_requests', 'challenges',
            'user_blocks', 'coupons', 'coupon_usage', 'leaderboards',
            'tournament_matches', 'game_achievements', 'tournament_achievements',
            'player_achievements', 'user_tournament_achievements', 'player_statistics'
        ]
        
        # Add any tables not in the ordered list
        for table in tables:
            if table not in table_order:
                table_order.append(table)
        
        # Only migrate tables that exist in SQLite
        tables_to_migrate = [t for t in table_order if t in tables]
        
        logger.info(f"📋 Migration order: {tables_to_migrate}")
        
        # Migrate data
        failed_tables = []
        for table_name in tables_to_migrate:
            if not self.migrate_table_data(table_name):
                failed_tables.append(table_name)
        
        # Summary
        if failed_tables:
            logger.error(f"❌ Failed to migrate tables: {failed_tables}")
            return False
        else:
            logger.info("🎉 All data migrated successfully!")
            
            # Print final summary
            logger.info("📊 Migration Summary:")
            for table in tables_to_migrate:
                sqlite_count = self.get_table_row_count(self.sqlite_engine, table)
                postgres_count = self.get_table_row_count(self.postgres_engine, table)
                status = "✅" if sqlite_count == postgres_count else "❌"
                logger.info(f"  {status} {table}: {postgres_count} rows")
            
            return True

def main():
    """Main migration execution"""
    migration = DataMigration()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    logger.info(f"📅 Data migration started at: {timestamp}")
    
    success = migration.run_migration()
    
    if success:
        logger.info("✅ Data migration completed successfully!")
        logger.info("🔄 Next steps:")
        logger.info("   1. Test backend with PostgreSQL")
        logger.info("   2. Run performance tests")
        logger.info("   3. Deploy to production")
    else:
        logger.error("❌ Data migration failed! Check logs above")
        sys.exit(1)

if __name__ == "__main__":
    main()