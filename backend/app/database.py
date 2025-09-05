from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# HARDCODED POSTGRESQL
DATABASE_URL = "postgresql://lfa_user:NVI29jPjzKO68kJi8SMcp4cT@/lfa_legacy_go?host=/cloudsql/lfa-legacy-go:europe-west1:lfa-legacy-go-postgres"

print(f"AUTH ROUTER PostgreSQL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
