# migrate_to_postgres.py
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self):
        self.sqlite_conn = sqlite3.connect('backend/lfa_legacy_go.db')
        self.sqlite_conn.row_factory = sqlite3.Row
        
        # Use environment variables
        db_url = os.getenv('DATABASE_URL', 'postgresql://lfa_user:lfa_password@localhost:5432/lfa_production')
        
        # Parse connection string
        import urllib.parse as urlparse
        url = urlparse.urlparse(db_url)
        
        self.postgres_conn = psycopg2.connect(
            host=url.hostname,
            port=url.port or 5432,
            database=url.path[1:],  # Remove leading slash
            user=url.username,
            password=url.password
        )
    
    def get_table_exists(self, table_name):
        """Check if table exists in SQLite"""
        cursor = self.sqlite_conn.cursor()
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name=?
        """, (table_name,))
        return cursor.fetchone() is not None
    
    def migrate_table(self, table_name):
        """Migrate table from SQLite to PostgreSQL"""
        if not self.get_table_exists(table_name):
            logger.warning(f"Table {table_name} does not exist in SQLite, skipping")
            return 0
            
        logger.info(f"Migrating table: {table_name}")
        
        # Get data from SQLite
        sqlite_cursor = self.sqlite_conn.cursor()
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            logger.info(f"Table {table_name} is empty, skipping")
            return 0
            
        # Convert to list of tuples
        data = [tuple(row) for row in rows]
        columns = [description[0] for description in sqlite_cursor.description]
        
        # Clear existing data in PostgreSQL table
        postgres_cursor = self.postgres_conn.cursor()
        postgres_cursor.execute(f"TRUNCATE TABLE {table_name} CASCADE")
        
        # Insert into PostgreSQL
        placeholders = ','.join(['%s'] * len(columns))
        insert_query = f"INSERT INTO {table_name} ({','.join(columns)}) VALUES ({placeholders})"
        
        execute_values(
            postgres_cursor,
            insert_query,
            data,
            template=None,
            page_size=1000
        )
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(data)} rows to {table_name}")
        return len(data)
    
    def run_migration(self):
        """Run complete migration"""
        tables_to_migrate = [
            'users', 'tournaments', 'tournament_participants',
            'challenges', 'friend_requests', 'friendships',
            'locations', 'game_results'
        ]
        
        total_migrated = 0
        
        for table in tables_to_migrate:
            try:
                count = self.migrate_table(table)
                total_migrated += count
            except Exception as e:
                logger.error(f"Migration failed for {table}: {e}")
                self.postgres_conn.rollback()
                raise
        
        logger.info(f"Migration completed successfully! Total rows migrated: {total_migrated}")
        
    def close(self):
        self.sqlite_conn.close()
        self.postgres_conn.close()

if __name__ == "__main__":
    migrator = DatabaseMigrator()
    try:
        migrator.run_migration()
    finally:
        migrator.close()