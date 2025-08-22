// === Environment Configuration ===
const config = {
  API_URL:
    process.env.REACT_APP_API_URL ||
    "https://lfa-legacy-go-backend-376491487980.us-central1.run.app",
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.REACT_APP_DEBUG === "true",
};

// Validation on app start
if (!config.API_URL.includes("lfa-legacy-go-backend")) {
  console.error("🚨 WRONG API_URL:", config.API_URL);
  if (config.DEBUG) {
    alert(
      `Configuration Error: API URL is ${config.API_URL}. Expected: Google Cloud Run URL`
    );
  }
}

console.log("🔧 Environment Config:", {
  API_URL: config.API_URL,
  NODE_ENV: config.NODE_ENV,
  DEBUG: config.DEBUG,
});

export default config;
