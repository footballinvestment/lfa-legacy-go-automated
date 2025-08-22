# 🚀 LFA Legacy GO - Production Deployment Guide

## 📋 **PRE-DEPLOYMENT CHECKLIST**

Before deploying to production, ensure you have:

- [ ] PostgreSQL database ready (Cloud SQL, Heroku Postgres, etc.)
- [ ] Redis instance for caching (optional but recommended)  
- [ ] Domain name and SSL certificate
- [ ] Cloud provider account (Railway, Heroku, or Google Cloud)
- [ ] Environment variables configured
- [ ] Database migration tested

---

## 🗄️ **OPTION 1: PostgreSQL Database Setup**

### **Google Cloud SQL (Recommended)**

```bash
# 1. Create PostgreSQL instance
gcloud sql instances create lfa-postgres \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-type=SSD

# 2. Create database
gcloud sql databases create lfa_legacy_go --instance=lfa-postgres

# 3. Create user
gcloud sql users create lfa_user --instance=lfa-postgres --password=[PASSWORD]

# 4. Get connection string
gcloud sql instances describe lfa-postgres --format="value(connectionName)"
# Result: project:region:instance-name
```

### **Heroku Postgres**

```bash
# Add Heroku Postgres addon
heroku addons:create heroku-postgresql:hobby-dev
heroku config:get DATABASE_URL
```

### **Railway PostgreSQL**

```bash
# In Railway dashboard:
# 1. Add PostgreSQL service
# 2. Get connection string from Variables tab
```

---

## 📊 **DATABASE MIGRATION**

### **Step 1: Prepare Migration**

```bash
# Navigate to backend directory
cd backend

# Set environment variables
export SQLITE_PATH="./lfa_legacy_go.db"
export POSTGRES_URL="postgresql://user:password@host:port/database"

# Install dependencies
pip install psycopg2-binary
```

### **Step 2: Run Migration**

```bash
# Run the migration script
python migrations/production_setup.py

# The script will:
# ✅ Validate both database connections
# ✅ Export all data from SQLite
# ✅ Create PostgreSQL schema with indexes  
# ✅ Import data with foreign key handling
# ✅ Validate migration success
# ✅ Generate migration log
```

### **Step 3: Verify Migration**

```bash
# Check the migration log
cat migration_log_*.json

# Verify data in PostgreSQL
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM users;"
```

---

## 🚀 **DEPLOYMENT OPTIONS**

## **OPTION A: Railway (Recommended - Easiest)**

### **1. Setup Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway  
railway login

# Initialize project
railway init

# Link to existing project or create new
railway link [project-id]
```

### **2. Configure Environment Variables**

```bash
# Set database URL
railway variables set DATABASE_URL=postgresql://user:pass@host:port/db

# Set Redis URL (optional)
railway variables set REDIS_URL=redis://host:port

# Set secret key
railway variables set SECRET_KEY=your-super-secret-key

# Set admin password
railway variables set ADMIN_PASSWORD=secure-admin-password

# Set environment
railway variables set ENVIRONMENT=production
```

### **3. Deploy Backend**

```bash
# Deploy from backend directory
cd backend
railway up

# Your app will be available at:
# https://your-app-name.up.railway.app
```

---

## **OPTION B: Heroku**

### **1. Setup Heroku**

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create lfa-legacy-go-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis (optional)
heroku addons:create heroku-redis:hobby-dev
```

### **2. Configure Environment**

```bash
# Set environment variables
heroku config:set ENVIRONMENT=production
heroku config:set SECRET_KEY=your-super-secret-key  
heroku config:set ADMIN_PASSWORD=secure-admin-password

# Database URL is auto-configured by Heroku Postgres addon
```

### **3. Deploy**

```bash
# From backend directory
git add .
git commit -m "Production deployment"
git push heroku main

# Scale up
heroku ps:scale web=1
```

---

## **OPTION C: Google Cloud Platform**

### **1. Setup GCP**

```bash
# Install gcloud CLI and login
gcloud auth login
gcloud config set project YOUR-PROJECT-ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable appengine.googleapis.com
```

### **2. Configure Environment**

```bash
# Create secret versions
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-secret-key" | gcloud secrets create secret-key --data-file=-

# Update app.yaml with secret references
```

### **3. Deploy**

```bash
# From backend directory
gcloud app deploy app.yaml

# Your app will be at:
# https://YOUR-PROJECT-ID.appspot.com
```

---

## 🌐 **FRONTEND DEPLOYMENT**

### **Build for Production**

```bash
# Navigate to frontend directory
cd frontend

# Set production API URL
echo "REACT_APP_API_URL=https://your-backend-url.com" > .env.production

# Build production bundle
npm run build

# The build/ directory contains your production frontend
```

### **Deploy Frontend Options**

**Netlify (Recommended):**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy  
vercel --prod
```

**Firebase Hosting:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize and deploy
firebase init hosting
firebase deploy
```

---

## 🔒 **SSL/HTTPS CONFIGURATION**

Most cloud platforms provide automatic HTTPS:

- **Railway**: Automatic HTTPS for all deployments
- **Heroku**: Automatic HTTPS with custom domains  
- **Google Cloud**: Managed SSL certificates
- **Netlify/Vercel**: Automatic HTTPS for frontend

### **Custom Domain Setup**

1. **Add domain to your cloud provider**
2. **Update DNS records** to point to your deployment
3. **Enable SSL certificate** (usually automatic)
4. **Update CORS_ORIGINS** in backend environment variables

---

## 📊 **MONITORING SETUP**

### **Health Check Endpoints**

Your deployment should respond to:
- `GET /health` - Basic health check
- `GET /api/performance` - Performance metrics
- `GET /api/performance/summary` - Performance summary

### **Monitoring Tools**

**Application Monitoring:**
- **Railway**: Built-in metrics dashboard
- **Heroku**: Heroku Metrics or New Relic
- **GCP**: Google Cloud Monitoring

**Database Monitoring:**
- **PostgreSQL**: Built-in pg_stat_* views
- **Cloud providers**: Native database monitoring

**Error Tracking:**
- **Sentry** (recommended)
- **LogRocket** for frontend
- **Datadog** for comprehensive monitoring

---

## 🧪 **POST-DEPLOYMENT VALIDATION**

### **Backend Health Check**

```bash
# Test all endpoints
curl https://your-backend-url.com/health
curl https://your-backend-url.com/api/performance/summary

# Test authentication
curl -X POST https://your-backend-url.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

### **Frontend Validation**

```bash
# Test frontend loading
curl -I https://your-frontend-url.com

# Check bundle size
curl -s https://your-frontend-url.com/static/js/main.*.js | wc -c
```

### **Performance Testing**

```bash
# Load test the API
ab -n 100 -c 10 https://your-backend-url.com/health

# Or use Artillery for comprehensive testing
npm install -g artillery
artillery quick --count 100 --num 10 https://your-backend-url.com/
```

---

## ⚠️ **COMMON ISSUES & SOLUTIONS**

### **Database Connection Issues**

```bash
# Check connection string format
postgresql://username:password@host:port/database

# Test connection manually
psql "postgresql://username:password@host:port/database" -c "SELECT 1;"
```

### **Environment Variables**

```bash
# Verify all required variables are set
echo $DATABASE_URL
echo $SECRET_KEY
echo $ENVIRONMENT
```

### **CORS Issues**

```python
# Update CORS_ORIGINS in backend
CORS_ORIGINS = "https://your-frontend-domain.com,https://www.your-frontend-domain.com"
```

### **Performance Issues**

```bash
# Check database connection pool
# Monitor with /api/performance endpoint
# Review logs for slow queries
```

---

## 🎯 **PRODUCTION READINESS CHECKLIST**

### **Security**
- [ ] HTTPS enabled
- [ ] Secret keys properly configured
- [ ] Database credentials secure
- [ ] CORS properly configured
- [ ] Input validation active

### **Performance**  
- [ ] Database connection pooling enabled
- [ ] Redis caching configured (optional)
- [ ] Frontend bundle optimized (<1MB)
- [ ] API response times <200ms
- [ ] Health checks responding

### **Monitoring**
- [ ] Health check endpoints working
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Database monitoring setup
- [ ] Log aggregation configured

### **Backup & Recovery**
- [ ] Database backup strategy
- [ ] Application deployment backup
- [ ] Rollback plan tested
- [ ] Recovery procedures documented

---

## 📞 **SUPPORT CONTACTS**

**Cloud Provider Support:**
- **Railway**: https://railway.app/help
- **Heroku**: https://help.heroku.com
- **Google Cloud**: https://cloud.google.com/support

**Database Issues:**
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Connection Troubleshooting**: Check firewall, connection limits, SSL settings

**Deployment Issues:**
- Check deployment logs
- Verify environment variables
- Test health check endpoints
- Review error tracking tools

---

🚀 **Your LFA Legacy GO system is now production-ready!**