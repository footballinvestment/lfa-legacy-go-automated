#!/bin/bash
echo "Setting up local development environment..."

# Create local admin user
python scripts/create_local_admin.py

# Verify admin user exists
python -c "
from app.database import SessionLocal
from app.models.user import User
session = SessionLocal()
admin = session.query(User).filter(User.username == 'admin').first()
print('Admin user exists:', admin is not None)
session.close()
"

echo "Local development setup complete"