// === Environment Configuration - FIXED VERSION ===
const config = {
  API_URL:
    process.env.REACT_APP_API_URL ||
    "http://localhost:8002", // FIXED: Default to local backend on port 8002
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.REACT_APP_DEBUG === "true",
};

// FIXED: Updated validation for local development
if (config.NODE_ENV === "development" && !config.API_URL.includes("localhost:8002")) {
  console.warn("⚠️ API_URL not localhost:8002 in development:", config.API_URL);
  if (config.DEBUG) {
    alert(
      `Development Warning: API URL is ${config.API_URL}. Expected: http://localhost:8002`
    );
  }
}

console.log("🔧 Environment Config:", {
  API_URL: config.API_URL,
  NODE_ENV: config.NODE_ENV,
  DEBUG: config.DEBUG,
});

export default config;
