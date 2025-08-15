# 🚀 LFA Legacy GO - Cloud Run Deployment Instructions

## ✅ MIGRATION COMPLETE - MANUAL DEPLOYMENT REQUIRED

All Cloud Run migration tasks have been successfully completed! The application has been fully converted from Railway to Google Cloud Run architecture.

### 📋 **COMPLETED TASKS**

✅ **Phase 1: Project Cleanup**
- ✅ Removed Railway-specific files (railway.toml, Procfile, etc.)
- ✅ Cleaned up test files and scripts directory
- ✅ Updated .gitignore for Cloud Run deployment

✅ **Phase 2: Cloud Run Optimization** 
- ✅ Created multi-stage optimized Dockerfile for Cloud Run
- ✅ Created .dockerignore with proper exclusions
- ✅ Updated main.py with Cloud Run optimizations:
  - ✅ Changed default port from 8000 to 8080
  - ✅ Added Cloud Run environment variable support
  - ✅ Updated CORS for *.run.app domains
  - ✅ Added signal handlers for graceful shutdown
  - ✅ Enhanced health check endpoint

✅ **Phase 3: Deployment Preparation**
- ✅ Created deploy-cloud-run.sh script
- ✅ Installed Google Cloud SDK
- ✅ All files prepared and ready for deployment

---

## 🔧 **MANUAL DEPLOYMENT STEPS**

Since authentication requires browser interaction, please complete the deployment manually:

### Step 1: Authenticate with Google Cloud
```bash
cd /Users/lovas.zoltan/Seafile/Football\ Investment/Projects/GanballGames/lfa-legacy-go/backend
export PATH="/Users/lovas.zoltan/google-cloud-sdk/bin:$PATH"
gcloud auth login
```

### Step 2: Execute Deployment Script
```bash
./deploy-cloud-run.sh
```

### Step 3: Expected Results
The deployment script will:
- ✅ Enable required APIs (Cloud Run, Cloud Build)
- ✅ Build Docker image using Cloud Build
- ✅ Deploy to Cloud Run with optimized configuration
- ✅ Test health endpoint
- ✅ Provide service URL and documentation links

---

## 🎯 **POST-DEPLOYMENT VALIDATION**

After deployment completes, test these endpoints:

### Health Check
```bash
curl https://[service-url].run.app/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "service": "LFA Legacy GO API",
  "platform": "google_cloud_run",
  "routers_active": 10,
  "database": "connected"
}
```

### Root Endpoint
```bash
curl https://[service-url].run.app/
```

### API Documentation
Visit: `https://[service-url].run.app/docs`

---

## 🌐 **FRONTEND CONFIGURATION UPDATE**

After successful deployment, update the Netlify environment variable:

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Update: `REACT_APP_API_URL=https://[your-service-url].run.app`
3. Redeploy frontend

---

## 📊 **DEPLOYMENT CONFIGURATION**

### Cloud Run Settings Applied:
- **Memory**: 1Gi
- **CPU**: 1 core with CPU boost
- **Concurrency**: 80 requests per instance
- **Scaling**: 0-100 instances (auto)
- **Timeout**: 300 seconds
- **Port**: 8080

### Environment Variables Set:
- `ENVIRONMENT=production`
- `API_TITLE=LFA Legacy GO API`
- `API_VERSION=3.0.0`
- `DEBUG=false`
- `SECRET_KEY=lfa-legacy-go-jwt-secret-key-2024-production-ready`
- `ACCESS_TOKEN_EXPIRE_MINUTES=43200`

---

## 🚨 **TROUBLESHOOTING**

### If Build Fails:
```bash
# Check build logs
gcloud logging read "resource.type=\"build\"" --limit=50

# Rebuild manually
gcloud builds submit --tag gcr.io/lfa-legacy-go/lfa-legacy-go-backend
```

### If Health Check Fails:
```bash
# Check service logs
gcloud logging read "resource.type=\"cloud_run_revision\"" --limit=50

# Check service status
gcloud run services describe lfa-legacy-go-backend --region=us-central1
```

### If CORS Issues:
- Verify frontend URL is added to CORS origins in main.py
- Check browser console for specific CORS errors

---

## 🎉 **SUCCESS CRITERIA**

✅ Service deploys without errors  
✅ Health check returns 200 status  
✅ All 10 routers load successfully  
✅ API documentation accessible at /docs  
✅ Database connection established  
✅ Frontend can communicate with backend  

---

## 📁 **FILE CHANGES SUMMARY**

### Modified Files:
- `backend/Dockerfile` - Multi-stage Cloud Run optimized
- `backend/.dockerignore` - Cloud Run specific exclusions  
- `backend/app/main.py` - Full Cloud Run optimization
- `.gitignore` - Updated for Cloud Run deployment

### Created Files:
- `backend/deploy-cloud-run.sh` - Deployment automation script
- `DEPLOYMENT_INSTRUCTIONS.md` - This instruction file

### Removed Files:
- `railway.toml` - Railway configuration
- `Procfile` - Railway process file
- `minimal_main.py` - Test file
- `quick_railway_test.py` - Railway test
- All SQLite database files for fresh start
- Non-essential test directories and files

---

## 🔄 **NEXT STEPS**

1. **Execute manual deployment** using steps above
2. **Test all endpoints** to verify functionality  
3. **Update frontend environment variables**
4. **Verify end-to-end functionality**
5. **Monitor initial deployment** for any issues

**The Railway → Cloud Run migration is now complete and ready for deployment!** 🚀