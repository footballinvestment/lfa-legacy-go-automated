// === Environment Configuration - FIXED VERSION ===
const config = {
  API_URL: process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? "https://lfa-legacy-go-backend-376491487980.us-central1.run.app"
      : "http://localhost:8002"),
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.REACT_APP_DEBUG === "true",
};

// Environment validation for development vs production
if (config.NODE_ENV === "development" && !config.API_URL.includes("localhost")) {
  console.warn("⚠️ Using production API in development mode:", config.API_URL);
} else if (config.NODE_ENV === "production" && config.API_URL.includes("localhost")) {
  console.error("🚨 CRITICAL: Using localhost API in production mode!");
}

console.log("🔧 Environment Config:", {
  API_URL: config.API_URL,
  NODE_ENV: config.NODE_ENV,
  DEBUG: config.DEBUG,
});

export default config;
