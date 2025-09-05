import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSafeAuth } from "../SafeAuthContext";

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSafeAuth();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!state.user) {
      navigate("/login");
      return;
    }
    
    const isAdmin = state.user?.user_type === "admin" || 
                   state.user?.user_type === "moderator" || 
                   state.user?.is_admin === true;
                   
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [state, navigate]);

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
      <h1>Admin Panel</h1>
      <div style={{ 
        background: "#e8f5e8", 
        padding: "10px", 
        borderRadius: "5px",
        marginBottom: "20px" 
      }}>
        <p><strong>Admin Access Confirmed</strong></p>
        <p>Welcome, {state.user.full_name} ({state.user.user_type})</p>
        <p>Admin status: {String(state.user.is_admin)}</p>
      </div>
      
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