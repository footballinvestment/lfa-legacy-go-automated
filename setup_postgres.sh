#!/bin/bash
# setup_postgres.sh - PostgreSQL database setup

echo "🔧 PostgreSQL Database Setup Started..."

# Connect to PostgreSQL as superuser and create database + user
psql postgres << 'EOF'
-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'lfa_user') THEN

      CREATE ROLE lfa_user LOGIN PASSWORD 'lfa_password';
   END IF;
END
$do$;

-- Create database if not exists
SELECT 'CREATE DATABASE lfa_production OWNER lfa_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lfa_production')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lfa_production TO lfa_user;

-- Connect to new database and set up schema
\c lfa_production

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO lfa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lfa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lfa_user;

-- Show created user and database
\du lfa_user
\l lfa_production

EOF

echo "✅ PostgreSQL setup completed!"
echo "Testing connection..."

# Test connection
PGPASSWORD=lfa_password psql -h localhost -U lfa_user -d lfa_production -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    exit 1
fi