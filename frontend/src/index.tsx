// src/index.tsx
// LFA Legacy GO - React App Entry Point

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App-emergency";
import { verifyAPIConnectivity } from "./utils/apiTest";

// React Error #130 Fixed - AuthContext Promise.race issue resolved
console.log('🚀 LFA Legacy GO - React Error #130 FIXED - AuthContext Issue Resolved');
console.log('Build timestamp:', new Date().toISOString());

// Initialize API connectivity test
verifyAPIConnectivity().then(success => {
  console.log(success ? '✅ API connectivity verified' : '❌ API connectivity failed');
});

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
