# 🚀 Railway Deployment Commands

## **Required Environment Variables**

Set these in Railway dashboard or via CLI:

```bash
# Database Configuration
railway variables set DATABASE_URL="[GET FROM RAILWAY POSTGRESQL SERVICE]"

# Application Configuration  
railway variables set ENVIRONMENT="production"
railway variables set SECRET_KEY="$(openssl rand -hex 32)"
railway variables set ADMIN_PASSWORD="$(openssl rand -base64 16)"

# CORS Configuration (update with your frontend domain)
railway variables set CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Optional Performance Settings
railway variables set DB_POOL_SIZE="10"
railway variables set DB_MAX_OVERFLOW="20"
railway variables set RATE_LIMIT_REQUESTS="100"
railway variables set RATE_LIMIT_WINDOW="60"
```

## **Deployment Steps**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to project
cd backend

# 4. Initialize project  
railway init lfa-legacy-go-backend

# 5. Add PostgreSQL service
# Via Railway dashboard: Add Service > PostgreSQL
# Copy the DATABASE_URL from the PostgreSQL service

# 6. Set environment variables (use the commands above)

# 7. Deploy
railway up

# 8. Your API will be available at:
# https://[your-railway-app].up.railway.app
```

## **Post-Deployment Testing**

```bash
# Replace YOUR_URL with your Railway deployment URL
export API_URL="https://your-app.up.railway.app"

# Test endpoints
curl $API_URL/
curl $API_URL/health  
curl $API_URL/api/status
curl $API_URL/docs

# Test performance
curl $API_URL/api/performance
```

## **Railway Configuration Files**

The following files are already configured for Railway:

- ✅ `railway.toml` - Railway deployment configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `app/main.py` - Production-ready FastAPI app
- ✅ Database migration scripts in `migrations/`

## **Database Migration After Deployment**

```bash
# Connect to your deployed app
railway shell

# Run database migration (if needed)
python migrations/production_setup.py

# Or set up via Railway console
```

## **Monitoring Your Deployment**

Railway provides built-in monitoring:
- View logs: `railway logs`
- Monitor metrics in Railway dashboard
- Use the API endpoints: `/health`, `/api/status`, `/api/performance`

## **Custom Domain Setup (Optional)**

```bash
# Add custom domain via Railway dashboard
# Update CORS_ORIGINS environment variable
railway variables set CORS_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"
```

## **Ready to Deploy!**

Your production API has been tested and is ready:
- ✅ All 11/11 routers active
- ✅ Health checks passing
- ✅ API standards implemented  
- ✅ PostgreSQL migration scripts ready
- ✅ Production middleware configured
- ✅ Error handling and logging active

**Current Status: Ready for Railway deployment!**