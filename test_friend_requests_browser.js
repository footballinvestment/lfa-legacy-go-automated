// Browser console test script for friend requests
// Copy-paste this into the browser console on http://localhost:3000

async function testFriendRequestFlow() {
  console.log('🧪 FRIEND REQUEST SYSTEM TEST - FULL FLOW');
  console.log('==========================================');
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ Nincs auth token! Jelentkezz be először.');
      return;
    }

    // 1. Current user check
    const response = await fetch('http://localhost:8000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const currentUser = await response.json();
    console.log(`👤 Current user: ${currentUser.username} (ID: ${currentUser.id})`);

    // 2. Incoming requests
    const incomingResponse = await fetch('http://localhost:8000/api/social/friend-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const incoming = await incomingResponse.json();
    console.log(`📥 Incoming requests: ${incoming.length}`);
    incoming.forEach(req => {
      console.log(`   - From: ${req.from_user?.username} (ID: ${req.from_user_id})`);
    });

    // 3. Sent requests - NEW TEST
    const sentResponse = await fetch('http://localhost:8000/api/social/friend-requests/sent', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (sentResponse.ok) {
      const sent = await sentResponse.json();
      console.log(`📤 Sent requests: ${sent.length}`);
      sent.forEach(req => {
        console.log(`   - To: ${req.to_user?.username} (ID: ${req.to_user_id})`);
      });
      console.log('✅ SENT ENDPOINT WORKS!');
    } else {
      console.error('❌ SENT ENDPOINT FAILED:', sentResponse.status);
    }

    console.log('✅ Test completed successfully!');
    console.log(`📊 Summary: ${incoming.length} incoming, ${sent?.length || 0} sent`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
testFriendRequestFlow();