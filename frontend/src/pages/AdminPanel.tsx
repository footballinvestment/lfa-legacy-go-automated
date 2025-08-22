// AdminPanel.tsx - ENHANCED DEBUG VERSION
// Updated with comprehensive debugging for admin access issues

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSafeAuth } from "../SafeAuthContext";

const AdminPanel: React.FC = () => {
  console.log("🚀 ADMIN PANEL LOADED"); // ✅ ENHANCED: More visible log
  const navigate = useNavigate();
  const { state } = useSafeAuth();
  const [activeTab, setActiveTab] = useState(0);

  // ✅ ENHANCED: Comprehensive admin access debugging
  useEffect(() => {
    console.log("=".repeat(50));
    console.log("🔍 ADMIN PANEL - COMPREHENSIVE DEBUG");
    console.log("=".repeat(50));
    
    // Basic state information
    console.log("📊 Auth State:", {
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      hasUser: !!state.user,
      error: state.error
    });
    
    // User object details
    if (state.user) {
      console.log("👤 User Details:", {
        id: state.user.id,
        username: state.user.username,
        email: state.user.email,
        user_type: state.user.user_type,
        is_admin: state.user.is_admin
      });
      
      // ✅ ENHANCED: All possible admin checks
      const adminChecks = {
        byUserType: state.user.user_type === "admin",
        byModeratorType: state.user.user_type === "moderator", 
        byIsAdmin: state.user.is_admin === true,
        finalComputed: state.user?.user_type === "admin" || 
                      state.user?.user_type === "moderator" || 
                      state.user?.is_admin === true
      };
      
      console.log("🛡️ Admin Access Checks:", adminChecks);
      
      // ✅ ENHANCED: Raw user object from API
      console.log("🔬 RAW User Object Keys:", Object.keys(state.user));
      console.log("🧪 RAW User Object:", state.user);
      
    } else {
      console.log("❌ No user object found in state");
    }
    
    console.log("=".repeat(50));
    
    // ✅ ENHANCED: Wait for auth to complete before checking admin
    if (state.loading) {
      console.log("⏳ Still loading authentication state, waiting...");
      return;
    }
    
    if (!state.user) {
      console.log("🚫 No user found, redirecting to login");
      navigate("/login");
      return;
    }
    
    // ✅ ENHANCED: Multiple admin check strategies
    const isAdmin = state.user?.user_type === "admin" || 
                   state.user?.user_type === "moderator" || 
                   state.user?.is_admin === true;
    
    console.log("🎯 FINAL ADMIN DECISION:", isAdmin);
    
    if (!isAdmin) {
      console.log("🚫 ACCESS DENIED: User is not admin");
      console.log("📝 Redirect reason:", {
        user_type: state.user?.user_type,
        is_admin: state.user?.is_admin,
        expected: "admin or moderator"
      });
      
      alert(`Admin access denied!\n\nCurrent user type: ${state.user?.user_type}\nIs admin: ${state.user?.is_admin}\n\nExpected: admin or moderator`);
      
      navigate("/dashboard");
      return;
    }
    
    console.log("✅ ADMIN ACCESS GRANTED - Welcome to admin panel!");
    
  }, [state, navigate]);

  // ✅ ENHANCED: Loading states
  if (state.loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading Admin Panel...</h2>
        <p>Verifying admin permissions...</p>
      </div>
    );
  }

  if (!state.user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Authentication Required</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // ✅ ENHANCED: Admin access verification with detailed feedback
  const isAdmin = state.user?.user_type === "admin" || 
                 state.user?.user_type === "moderator" || 
                 state.user?.is_admin === true;

  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>Admin privileges required</p>
        <p>Current user type: <strong>{state.user?.user_type || "unknown"}</strong></p>
        <p>Is admin: <strong>{String(state.user?.is_admin)}</strong></p>
        <button onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛡️ Admin Panel</h1>
      <div style={{ 
        background: "#e8f5e8", 
        padding: "10px", 
        borderRadius: "5px",
        marginBottom: "20px" 
      }}>
        <p><strong>✅ Admin Access Confirmed</strong></p>
        <p>Welcome, {state.user.full_name} ({state.user.user_type})</p>
        <p>Admin status: {String(state.user.is_admin)}</p>
      </div>
      
      {/* Rest of admin panel content will go here */}
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "5px" }}>
        <h3>Admin Panel Content</h3>
        <p>Admin panel functionality will be implemented here.</p>
        <p>Current admin user: <strong>{state.user.username}</strong></p>
        <p>User type: <strong>{state.user.user_type}</strong></p>
        <p>Credits: <strong>{state.user.credits}</strong></p>
      </div>
    </div>
  );
};

export default AdminPanel;