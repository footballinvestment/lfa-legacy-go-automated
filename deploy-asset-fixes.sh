#!/bin/bash

# === LFA Legacy GO - Asset Loading Fixes Deployment ===

echo "🎯 === ASSET LOADING FIXES DEPLOYMENT ==="
echo "=========================================="

# Check if we're in the right directory
if [[ ! -d "frontend" || ! -d "backend" ]]; then
  echo "❌ Error: Must run from lfa-legacy-go root directory"
  exit 1
fi

echo "🔍 Asset Fix Status Check:"
echo ""

# Check critical files
if [[ -f "frontend/public/emergency-stop.js" ]]; then
  echo "✅ Emergency stop script: READY"
else
  echo "❌ Emergency stop script: MISSING"
fi

if [[ -f "frontend/public/favicon.ico" ]]; then
  echo "✅ Favicon: READY"
else
  echo "❌ Favicon: MISSING"
fi

if [[ -f "frontend/public/logo192.png" ]]; then
  echo "✅ Logo192: READY"
else
  echo "❌ Logo192: MISSING"
fi

if [[ -f "frontend/build/static/css/main.97fa2dfa.css" ]]; then
  echo "✅ CSS build: READY"
else
  echo "❌ CSS build: MISSING"
fi

echo ""
echo "🚨 CRITICAL ISSUES BEING FIXED:"
echo "   • NS_BINDING_ABORTED errors for static assets"
echo "   • Missing favicon.ico causing 404 errors"
echo "   • Missing logo192.png causing loading issues"
echo "   • CSS not loading properly in production"
echo "   • Emergency stop mechanism deployment"

echo ""
echo "📦 Files being deployed:"
echo "   • frontend/public/emergency-stop.js (emergency loop prevention)"
echo "   • frontend/public/favicon.ico (fixed 404 error)"
echo "   • frontend/public/logo192.png (PWA compatibility)"
echo "   • frontend/public/logo512.png (PWA compatibility)"
echo "   • frontend/public/manifest.json (updated PWA manifest)"
echo "   • frontend/public/index.html (emergency script integration)"

echo ""
read -p "🚀 Deploy asset fixes to resolve loading issues? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Staging asset fixes..."
    
    # Add critical asset files
    git add frontend/public/emergency-stop.js
    git add frontend/public/favicon.ico
    git add frontend/public/logo192.png
    git add frontend/public/logo512.png
    git add frontend/public/manifest.json
    git add frontend/public/index.html
    
    # Add build directory if it exists
    if [[ -d "frontend/build" ]]; then
      git add frontend/build/
      echo "✅ Build directory added to staging"
    fi
    
    echo "✅ Asset files staged for commit"
    
    echo ""
    echo "📝 Creating asset fix commit..."
    
    git commit -m "🔧 ASSET FIX: Resolve NS_BINDING_ABORTED and loading issues

Critical asset loading fixes:
- Add emergency-stop.js to prevent refresh loops
- Fix favicon.ico to eliminate 404 errors  
- Add logo192.png and logo512.png for PWA compatibility
- Update manifest.json with proper icons
- Integrate emergency script into index.html
- Rebuild with CSS assets properly compiled

Expected Results:
- No more NS_BINDING_ABORTED errors
- CSS loads properly (main.97fa2dfa.css)
- Static assets load without 404s
- Emergency stop protection active
- Application becomes fully functional

Root Cause: Missing static assets and improper build deployment

🤖 Generated with Claude Code Asset Recovery System
Co-Authored-By: Claude <noreply@anthropic.com>"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Asset fix commit created successfully"
        
        echo ""
        echo "🚀 Pushing asset fixes to GitHub..."
        git push origin main
        
        if [[ $? -eq 0 ]]; then
            echo ""
            echo "🎉 === ASSET FIXES DEPLOYED SUCCESSFULLY ==="
            echo ""
            echo "📊 Deployment Status:"
            echo "   ✅ Asset fixes committed to Git"  
            echo "   ✅ Pushed to GitHub (triggers Netlify deployment)"
            echo "   ⏳ Netlify will rebuild and deploy assets..."
            echo ""
            echo "🔗 Monitor deployment:"
            echo "   • Netlify Dashboard: https://app.netlify.com"
            echo "   • Live Site: https://lfa-legacy-go.netlify.app"
            echo ""
            echo "✅ Expected Results After Deployment:"
            echo "   • CSS loads properly (no more loading screen stuck)"
            echo "   • Favicon 404 errors eliminated"
            echo "   • Emergency stop script active"
            echo "   • Dashboard becomes visible and functional"
            echo "   • No more NS_BINDING_ABORTED errors"
            echo ""
            echo "🧪 Test Steps:"
            echo "   1. Wait for Netlify deployment to complete (~2-3 minutes)"
            echo "   2. Visit: https://lfa-legacy-go.netlify.app/dashboard" 
            echo "   3. Check Network tab - should see 200 OK for CSS"
            echo "   4. Verify page loads beyond loading screen"
            echo "   5. Emergency stop should work if needed"
            echo ""
            echo "🎯 SUCCESS: Critical asset loading fixes deployed!"
            
        else
            echo "❌ Error: Failed to push to GitHub"
            echo "Please check network connection and try: git push origin main"
            exit 1
        fi
    else
        echo "❌ Error: Failed to create commit"
        exit 1
    fi
else
    echo ""
    echo "❌ Deployment cancelled by user"
    echo "⚠️  WARNING: Asset loading issues will persist until deployed!"
    exit 1
fi