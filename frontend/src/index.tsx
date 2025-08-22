// src/index.tsx
// LFA Legacy GO - Performance Optimized Entry Point

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { setupGlobalErrorHandlers } from "./utils/errorHandler";
import { performanceMonitor } from "./utils/performanceMonitor";
import { memoryMonitor } from "./utils/memoryMonitor";
import { verifyAPIConnectivity } from "./utils/apiTest";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("🚀 LFA Legacy GO - Performance Optimized");
console.log("Build timestamp:", new Date().toISOString());

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize performance monitoring
performanceMonitor.startMonitoring();

// Initialize memory monitoring in development
if (process.env.NODE_ENV === "development") {
  memoryMonitor.startMonitoring();
  console.log("🧠 Memory monitoring enabled for development");

  // Log memory stats every 5 seconds in development
  setInterval(() => {
    const stats = memoryMonitor.getMemoryStats();
    if (stats?.current) {
      console.log(
        `🧠 Memory: ${Math.round(stats.current.usedJSHeapSize / 1024 / 1024)}MB used`
      );
    }
  }, 5000);
}

// Initialize API connectivity test
verifyAPIConnectivity()
  .then((success) => {
    console.log(
      success ? "✅ API connectivity verified" : "❌ API connectivity failed"
    );
  })
  .catch((error) => {
    console.error("❌ API connectivity test failed:", error);
  });

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
