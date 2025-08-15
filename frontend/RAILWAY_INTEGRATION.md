# Frontend Integration with Railway Backend

## 🔗 API URL Configuration Update

After deploying the backend to Railway, update the frontend API configuration:

### 1. Update Netlify Environment Variables

In Netlify dashboard:
1. Go to Site Settings → Environment Variables
2. Update `REACT_APP_API_URL` to your Railway backend URL

```bash
# Replace with your actual Railway domain
REACT_APP_API_URL=https://lfa-legacy-go-backend-production.up.railway.app
```

### 2. Frontend Code Updates

The API service automatically uses the environment variable:

```typescript
// src/services/api.ts (already configured)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
```

### 3. CORS Verification

The backend is already configured to accept requests from:
- `https://glittering-unicorn-b00443.netlify.app` (your Netlify frontend)
- `https://*.railway.app` (Railway domains)
- Local development domains

### 4. Test the Integration

After updating the environment variable and redeploying the frontend:

1. **Authentication**: Test login/register functionality
2. **Tournament System**: Verify tournament registration works
3. **Credits System**: Check credit transactions
4. **Social Features**: Test friend requests and interactions

### 5. Production Checklist

- [ ] Railway backend deployed successfully
- [ ] PostgreSQL database connected
- [ ] Environment variables configured
- [ ] CORS working for Netlify domain
- [ ] Frontend API URL updated
- [ ] Authentication flow tested
- [ ] Tournament registration tested
- [ ] All API endpoints accessible

## 🚀 Deployment Commands

### Backend (Railway)
```bash
# Connect to Railway (one-time setup)
npm install -g @railway/cli
railway login
railway link

# Deploy backend
railway up
```

### Frontend (Netlify)
```bash
# Update environment variable in Netlify dashboard
# Then trigger new deployment
git commit -m "Update API URL for Railway backend"
git push origin main
```

## 📊 Monitoring & Debugging

### Railway Backend Logs
```bash
railway logs --follow
```

### Frontend Console
Check browser console for any CORS or API connection errors.

### API Health Check
```bash
curl https://your-railway-domain.railway.app/health
```

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Verify Netlify domain is in backend CORS configuration
   - Check browser console for specific CORS error messages

2. **Authentication Issues**
   - Verify JWT tokens are being sent correctly
   - Check cookie/localStorage storage

3. **Database Connection**
   - Monitor Railway logs for database connection errors
   - Verify PostgreSQL service is running

4. **Environment Variables**
   - Double-check all required variables are set in Railway
   - Verify frontend REACT_APP_API_URL is correct

### Debug Steps:
1. Test backend directly: `https://your-domain.railway.app/docs`
2. Check Network tab in browser DevTools
3. Verify API responses in Railway logs
4. Test with Postman/curl if needed