#!/bin/bash

# === LFA Legacy GO - Emergency Refresh Loop Fix Deployment ===

echo "🚨 === EMERGENCY REFRESH LOOP FIX DEPLOYMENT ==="
echo "=================================================="

# Check if we're in the right directory
if [[ ! -d "frontend" || ! -d "backend" ]]; then
  echo "❌ Error: Must run from lfa-legacy-go root directory"
  exit 1
fi

# Show current status
echo "📊 Current git status:"
git status --short

echo ""
echo "🔍 Modified files for emergency fix:"
echo "✅ frontend/public/emergency-stop.js (new emergency stop mechanism)"
echo "✅ frontend/public/index.html (emergency script integration)"
echo "✅ frontend/src/utils/loopDetection.js (removed hard refresh)"
echo "✅ frontend/public/manifest.json (fixed PWA manifest)"
echo "✅ frontend/public/favicon.ico (created basic favicon)"

echo ""
echo "🚨 CRITICAL ISSUE BEING FIXED:"
echo "   • Infinite refresh loop caused by window.location.href in loopDetection.js"
echo "   • Emergency stop mechanism prevents browser freeze"
echo "   • Error capture system preserves logs across refreshes"
echo "   • Favicon 404 errors eliminated"

echo ""
read -p "🚀 Deploy emergency fix? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Staging emergency fixes..."
    
    # Add all emergency fix files
    git add frontend/public/emergency-stop.js
    git add frontend/public/index.html  
    git add frontend/src/utils/loopDetection.js
    git add frontend/public/manifest.json
    git add frontend/public/favicon.ico
    git add REFRESH-LOOP-EMERGENCY-FIX.md
    
    echo "✅ Files staged for commit"
    
    echo ""
    echo "📝 Creating emergency commit..."
    
    git commit -m "🚨 EMERGENCY FIX: Stop infinite refresh loop

- Add emergency stop mechanism (loads before React)
- Remove hard refresh from loopDetection.js 
- Add error capture system across refreshes
- Fix favicon and manifest 404 errors
- Prevent browser freeze from navigation loops

Critical: This fixes the continuous page refresh issue

Files modified:
- frontend/public/emergency-stop.js (new)
- frontend/public/index.html (emergency script added)
- frontend/src/utils/loopDetection.js (removed window.location.href)
- frontend/public/manifest.json (fixed)
- frontend/public/favicon.ico (created)

🤖 Generated with Claude Code Emergency Response System
Co-Authored-By: Claude <noreply@anthropic.com>"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Emergency commit created successfully"
        
        echo ""
        echo "🚀 Pushing emergency fix to GitHub..."
        git push origin main
        
        if [[ $? -eq 0 ]]; then
            echo ""
            echo "🎉 === EMERGENCY FIX DEPLOYED SUCCESSFULLY ==="
            echo ""
            echo "📊 Deployment Status:"
            echo "   ✅ Emergency fixes committed to Git"
            echo "   ✅ Pushed to GitHub (triggers Netlify deployment)"
            echo "   ⏳ Netlify deployment in progress..."
            echo ""
            echo "🔗 Monitor deployment:"
            echo "   • Netlify Dashboard: https://app.netlify.com"
            echo "   • Live Site: https://lfa-legacy-go.netlify.app"
            echo ""
            echo "✅ Expected Result:"
            echo "   • Page stops refreshing continuously"
            echo "   • Emergency UI shows if issues persist"
            echo "   • Application becomes accessible again"
            echo ""
            echo "🧪 Test Commands:"
            echo "   # Check if emergency stop is working:"
            echo "   localStorage.setItem('LFA_REFRESH_COUNT', '6'); location.reload();"
            echo ""
            echo "   # Check captured errors:"
            echo "   console.log(JSON.parse(localStorage.getItem('LFA_ERROR_LOG') || '[]'));"
            echo ""
            echo "🎯 SUCCESS: Emergency refresh loop fix deployed!"
            
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
    echo "⚠️  WARNING: Refresh loop issue will persist until deployed!"
    exit 1
fi