# migration_sqlite_to_postgres.py
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self):
        self.sqlite_conn = sqlite3.connect('lfa_legacy_go.db')
        self.postgres_conn = psycopg2.connect(
            host="localhost",
            database="lfa_production",
            user="lfa_user",
            password="lfa_password"
        )
        self.sqlite_conn.row_factory = sqlite3.Row
    
    def migrate_table(self, table_name, postgres_schema=None):
        """Migrate table from SQLite to PostgreSQL"""
        logger.info(f"Migrating table: {table_name}")
        
        # Get data from SQLite
        sqlite_cursor = self.sqlite_conn.cursor()
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            logger.info(f"Table {table_name} is empty, skipping")
            return
            
        # Convert to list of tuples
        data = [tuple(row) for row in rows]
        columns = [description[0] for description in sqlite_cursor.description]
        
        # Insert into PostgreSQL
        postgres_cursor = self.postgres_conn.cursor()
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
    
    def run_migration(self):
        """Run complete migration"""
        tables_to_migrate = [
            'users', 'tournaments', 'tournament_participants',
            'challenges', 'friend_requests', 'friendships',
            'locations', 'game_results'
        ]
        
        for table in tables_to_migrate:
            try:
                self.migrate_table(table)
            except Exception as e:
                logger.error(f"Migration failed for {table}: {e}")
                self.postgres_conn.rollback()
                raise
        
        logger.info("Migration completed successfully")

if __name__ == "__main__":
    migrator = DatabaseMigrator()
    migrator.run_migration()