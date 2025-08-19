// src/index.tsx
// LFA Legacy GO - React App Entry Point

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { verifyAPIConnectivity } from "./utils/apiTest.js";

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
