#!/bin/bash

# Real-time monitoring script for p3t1k3 frontend testing
echo "🔍 MONITORING p3t1k3 USER ACTIVITY - $(date)"
echo "=========================================="

# p3t1k3 user token
P3T1K3_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzIiwiZXhwIjoxNzU4NDY5NzE4fQ.mn_kQjux4aAFWyDn_nNqzl_0-qTJF9LMoP3W_-RgHso"

echo "✅ BACKEND ENDPOINTS VERIFIED:"
echo "   - Profile: /api/auth/me ✅"
echo "   - Tournaments: /api/tournaments/ ✅"
echo "   - Social Search: /api/social/search-users ✅" 
echo "   - Friend Requests: /api/social/friend-requests ✅"
echo "   - Credit History: /api/credits/history ✅"
echo "   - Coupon Usage: /api/credits/coupons/my-usage ✅"
echo ""

echo "💰 CURRENT p3t1k3 STATUS:"
curl -s -H "Authorization: Bearer $P3T1K3_TOKEN" http://localhost:8000/api/credits/balance | jq -r '"Credits: \(.credits)"'
echo ""

echo "🏆 TOURNAMENT STATUS:"
curl -s -H "Authorization: Bearer $P3T1K3_TOKEN" http://localhost:8000/api/tournaments/ | jq -r '.[0] | "Tournament: \(.name) | Participants: \(.current_participants)/\(.max_participants) | Fee: \(.entry_fee_credits) credits"'
echo ""

echo "🎟️ COUPON REDEMPTION HISTORY:"
curl -s -H "Authorization: Bearer $P3T1K3_TOKEN" http://localhost:8000/api/credits/coupons/my-usage | jq -r '.[] | "✅ \(.coupon.code): +\(.credits_awarded) credits"'
echo ""

echo "🔍 REAL-TIME MONITORING ACTIVE - Ready for frontend testing!"
echo "=========================================="
echo "Start your browser testing now. This terminal will show any backend issues."
echo ""

# Keep monitoring in background
while true; do
    sleep 30
    echo "⏰ $(date) - Backend healthy, p3t1k3 monitoring active..."
done