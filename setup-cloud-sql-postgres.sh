#!/bin/bash

# PostgreSQL Migration - Day 1 Setup Script
# Execute: chmod +x setup-cloud-sql-postgres.sh && ./setup-cloud-sql-postgres.sh

echo "🚀 LFA Legacy GO - PostgreSQL Setup Starting..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set project if needed
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project set. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "🔧 Using project: $PROJECT_ID"

# 1. Create Google Cloud SQL PostgreSQL instance
echo "📦 Creating PostgreSQL instance on Google Cloud..."
echo "This may take 5-10 minutes..."

gcloud sql instances create lfa-legacy-go-postgres \
    --database-version=POSTGRES_14 \
    --cpu=2 \
    --memory=4GB \
    --storage-size=20GB \
    --storage-type=SSD \
    --region=europe-west1 \
    --authorized-networks=0.0.0.0/0 \
    --backup-start-time=02:00 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=03 \
    --deletion-protection

if [ $? -ne 0 ]; then
    echo "❌ Failed to create PostgreSQL instance"
    exit 1
fi

echo "✅ PostgreSQL instance created successfully"

# 2. Create database and user
echo "🔐 Creating database and user..."

gcloud sql databases create lfa_legacy_go --instance=lfa-legacy-go-postgres

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database"
    exit 1
fi

# Generate secure random password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/' | tr -d '+' | cut -c1-24)
echo "Generated password: $POSTGRES_PASSWORD"
echo "SAVE THIS PASSWORD: $POSTGRES_PASSWORD" > postgres_credentials.txt

gcloud sql users create lfa_user \
    --instance=lfa-legacy-go-postgres \
    --password="$POSTGRES_PASSWORD"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create user"
    exit 1
fi

# 3. Get connection info
echo "📋 Getting connection information..."
INSTANCE_CONNECTION=$(gcloud sql instances describe lfa-legacy-go-postgres --format="value(connectionName)")
INSTANCE_IP=$(gcloud sql instances describe lfa-legacy-go-postgres --format="value(ipAddresses[0].ipAddress)")

echo "Instance Connection Name: $INSTANCE_CONNECTION" >> postgres_credentials.txt
echo "Instance IP: $INSTANCE_IP" >> postgres_credentials.txt
echo "Project ID: $PROJECT_ID" >> postgres_credentials.txt

# 4. Set up Cloud SQL Proxy for local development
echo "🔗 Setting up Cloud SQL Proxy..."

# Download appropriate Cloud SQL Proxy for the platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [[ "$OS" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        PROXY_URL="https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.arm64"
    else
        PROXY_URL="https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64"
    fi
elif [[ "$OS" == "linux" ]]; then
    PROXY_URL="https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64"
else
    echo "⚠️  Unsupported OS: $OS. Please download Cloud SQL Proxy manually."
    PROXY_URL="https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64"
fi

curl -o cloud_sql_proxy "$PROXY_URL"
chmod +x cloud_sql_proxy

echo "✅ Cloud SQL Proxy downloaded"

# 5. Update environment variables template
echo "📝 Creating environment configuration..."

cat > .env.postgres << EOF
# PostgreSQL Configuration for LFA Legacy GO
DATABASE_URL=postgresql://lfa_user:$POSTGRES_PASSWORD@localhost:5432/lfa_legacy_go
CLOUD_SQL_CONNECTION_NAME=$INSTANCE_CONNECTION
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=lfa_legacy_go
POSTGRES_USER=lfa_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Connection Pool Settings
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true

# For production deployment
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
EOF

# 6. Create Cloud SQL Proxy startup script
cat > start-cloud-sql-proxy.sh << EOF
#!/bin/bash
echo "🔗 Starting Cloud SQL Proxy..."
./cloud_sql_proxy -instances=$INSTANCE_CONNECTION=tcp:5432 &
PROXY_PID=\$!
echo "Cloud SQL Proxy started with PID: \$PROXY_PID"
echo "To stop proxy: kill \$PROXY_PID"
echo "Connection available at: localhost:5432"
EOF

chmod +x start-cloud-sql-proxy.sh

# 7. Test connection
echo "🧪 Testing PostgreSQL connection..."
./cloud_sql_proxy -instances=$INSTANCE_CONNECTION=tcp:5432 &
PROXY_PID=$!

# Wait for proxy to start
sleep 5

# Test connection using psql if available
if command -v psql &> /dev/null; then
    echo "Testing connection with psql..."
    PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5432 -U lfa_user -d lfa_legacy_go -c "SELECT version();"
    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL connection test successful!"
    else
        echo "❌ PostgreSQL connection test failed"
    fi
else
    echo "⚠️  psql not available for connection test"
fi

# Stop the test proxy
kill $PROXY_PID 2>/dev/null

echo ""
echo "✅ PostgreSQL setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Instance: $INSTANCE_CONNECTION"
echo "   - Database: lfa_legacy_go"
echo "   - User: lfa_user"
echo "   - Password saved in: postgres_credentials.txt"
echo "   - Environment config: .env.postgres"
echo ""
echo "🔗 To start Cloud SQL Proxy:"
echo "   ./start-cloud-sql-proxy.sh"
echo ""
echo "📄 Credentials saved to: postgres_credentials.txt"
echo "🎯 Next step: Run migration implementation script"
echo ""
echo "⚠️  IMPORTANT: Keep postgres_credentials.txt secure and do not commit to git!"