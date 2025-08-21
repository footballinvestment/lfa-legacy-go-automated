// src/index.tsx
// LFA Legacy GO - React App Entry Point - PRODUCTION READY

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App-step5-auth";
import { verifyAPIConnectivity } from "./utils/apiTest";

console.log('🔐 LFA Legacy GO - STEP 5: AUTHENTICATION RESTORATION');
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
