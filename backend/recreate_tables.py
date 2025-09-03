# recreate_tables.py
from app.database_postgres import engine, Base
from app.models.user_fixed import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def recreate_tables():
    """Drop and recreate all tables"""
    try:
        logger.info("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        
        logger.info("Creating new tables...")
        Base.metadata.create_all(bind=engine)
        
        logger.info("Tables recreated successfully!")
        
        # Verify table creation
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
            tables = [row[0] for row in result]
            logger.info(f"Tables created: {tables}")
            
    except Exception as e:
        logger.error(f"Error recreating tables: {e}")
        raise

if __name__ == "__main__":
    recreate_tables()