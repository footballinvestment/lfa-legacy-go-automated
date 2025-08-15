# LFA Legacy GO - Railway Deployment Guide

## 🚀 Railway Deployment Steps

### 1. Railway Account Setup
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub account
3. Connect your GitHub repository

### 2. Create New Project
1. Click "New Project" 
2. Select "Deploy from GitHub repo"
3. Choose `lfa-legacy-go` repository
4. Select the `backend` folder as root directory

### 3. Environment Variables Configuration
Set these environment variables in Railway dashboard:

```bash
# Database (Railway will auto-provision PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security
SECRET_KEY=lfa-legacy-go-jwt-secret-key-2024-production-ready
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# API Configuration  
API_TITLE=LFA Legacy GO API
API_VERSION=3.0.0
DEBUG=false

# Optional: Weather API
WEATHER_API_KEY=your_weather_api_key_here

# Railway auto-sets these:
PORT=${{PORT}}
RAILWAY_ENVIRONMENT=${{RAILWAY_ENVIRONMENT}}
RAILWAY_STATIC_URL=${{RAILWAY_STATIC_URL}}
```

### 4. Database Setup
1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL" 
3. Database will be auto-provisioned
4. DATABASE_URL will be automatically set

### 5. Deploy Settings
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Root Directory**: `/backend`

### 6. Custom Domain (Optional)
1. Go to Settings → Domains
2. Add custom domain if needed
3. Update CORS settings accordingly

## 🔧 Post-Deployment Configuration

### Update Frontend API URL
After deployment, update the frontend environment variables:

```javascript
// In Netlify dashboard, update environment variable:
REACT_APP_API_URL=https://your-railway-domain.railway.app
```

### Verify CORS Configuration  
The backend automatically includes Railway domains in CORS configuration:
- `https://*.railway.app`
- Your specific Railway domain

## 🧪 Testing Deployment

1. **Health Check**: `GET https://your-domain.railway.app/health`
2. **API Docs**: `https://your-domain.railway.app/docs`
3. **Root Endpoint**: `https://your-domain.railway.app/`

## 📊 Monitoring

Railway provides built-in monitoring:
- **Logs**: View application logs in real-time
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Track deployment history

## 🔒 Security Notes

1. **Database**: PostgreSQL with connection pooling
2. **HTTPS**: Automatically provided by Railway
3. **Environment Variables**: Securely managed by Railway
4. **CORS**: Configured for production domains only

## 🚨 Troubleshooting

### Common Issues:
1. **Build Fails**: Check requirements.txt compatibility
2. **Database Connection**: Verify DATABASE_URL format
3. **CORS Errors**: Update allowed origins list
4. **Port Issues**: Ensure using $PORT environment variable

### Debug Commands:
```bash
# Check logs
railway logs

# Connect to service
railway connect

# View environment variables
railway variables
```

## 📈 Scaling

Railway automatically handles:
- **Auto-scaling**: Based on traffic
- **Load balancing**: Multiple instances
- **Database connections**: Connection pooling
- **Memory management**: Automatic restarts

## 💰 Pricing

Railway offers:
- **Hobby Plan**: $5/month (perfect for this project)
- **Pro Plan**: $20/month (for higher traffic)
- **Enterprise**: Custom pricing

Current project estimated cost: **$5-10/month**