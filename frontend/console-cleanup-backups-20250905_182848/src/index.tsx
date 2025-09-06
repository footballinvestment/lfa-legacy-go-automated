import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { setupGlobalErrorHandlers } from "./utils/errorHandler";
import { performanceMonitor } from "./utils/performanceMonitor";
import { memoryMonitor } from "./utils/memoryMonitor";
import { verifyAPIConnectivity } from "./utils/apiTest";
import ErrorBoundary from "./components/ErrorBoundary";

// Force React to be available globally
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize performance monitoring
performanceMonitor.startMonitoring();

// Initialize memory monitoring in development only
if (process.env.NODE_ENV === "development") {
  memoryMonitor.startMonitoring();
}

// Initialize API connectivity test silently
verifyAPIConnectivity().catch(() => {
  // Silent fail - no console spam
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