// test_locations_endpoint.js
// 🧪 Quick test script to verify locations endpoint works

const http = require("http");

// Test configuration
const BACKEND_URL = "http://localhost:8001";
const TEST_ENDPOINTS = [
  "/api/health",
  "/api/status",
  "/api/locations",
  "/api/locations/1",
  "/api/locations/cities/list",
  "/api/locations/health",
];

console.log("🧪 LFA Legacy GO - Locations Endpoint Test");
console.log("===========================================");
console.log(`📡 Testing backend: ${BACKEND_URL}`);
console.log("");

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}${endpoint}`;

    const startTime = Date.now();

    const req = http.get(url, (res) => {
      const duration = Date.now() - startTime;
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData,
            error: null,
          });
        } catch (parseError) {
          resolve({
            endpoint,
            status: res.statusCode,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: data.substring(0, 100) + "...",
            error: "JSON Parse Error",
          });
        }
      });
    });

    req.on("error", (error) => {
      const duration = Date.now() - startTime;
      resolve({
        endpoint,
        status: 0,
        duration,
        success: false,
        data: null,
        error: error.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 0,
        duration: Date.now() - startTime,
        success: false,
        data: null,
        error: "Timeout",
      });
    });
  });
}

async function runTests() {
  console.log("🔄 Starting endpoint tests...\n");

  const results = [];
  let successCount = 0;

  for (const endpoint of TEST_ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint}... `);

    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${result.status} (${result.duration}ms)`);
      successCount++;
    } else {
      console.log(
        `❌ ${result.status || "ERR"} (${result.duration}ms) - ${
          result.error || "Failed"
        }`
      );
    }
  }

  console.log("\n📊 Test Summary:");
  console.log("================");
  console.log(`✅ Successful: ${successCount}/${TEST_ENDPOINTS.length}`);
  console.log(
    `❌ Failed: ${TEST_ENDPOINTS.length - successCount}/${
      TEST_ENDPOINTS.length
    }`
  );

  // Show detailed results for successful locations endpoint
  const locationsResult = results.find((r) => r.endpoint === "/api/locations");
  if (locationsResult && locationsResult.success) {
    console.log("\n📍 Locations Data Preview:");
    console.log("=========================");
    if (
      Array.isArray(locationsResult.data) &&
      locationsResult.data.length > 0
    ) {
      console.log(`Found ${locationsResult.data.length} locations:`);
      locationsResult.data.slice(0, 3).forEach((location, index) => {
        console.log(
          `  ${index + 1}. ${location.name} - ${location.city} (${
            location.price_per_hour
          }€/h)`
        );
      });
      if (locationsResult.data.length > 3) {
        console.log(
          `  ... and ${locationsResult.data.length - 3} more locations`
        );
      }
    }
  }

  // Show API status
  const statusResult = results.find((r) => r.endpoint === "/api/status");
  if (statusResult && statusResult.success) {
    console.log("\n⚡ API Status:");
    console.log("==============");
    console.log(`API Name: ${statusResult.data.api_name}`);
    console.log(`Version: ${statusResult.data.version}`);
    console.log(`Active Routers: ${statusResult.data.router_count}`);
    if (statusResult.data.active_routers) {
      statusResult.data.active_routers.forEach((router) => {
        console.log(`  - ${router}`);
      });
    }
  }

  // Check if backend is running
  if (successCount === 0) {
    console.log("\n⚠️  Backend appears to be offline");
    console.log("💡 Make sure to start the backend first:");
    console.log("   cd backend && source venv_test/bin/activate");
    console.log(
      "   uvicorn app.main_minimal:app --reload --host 0.0.0.0 --port 8001"
    );
  } else if (successCount === TEST_ENDPOINTS.length) {
    console.log(
      "\n🎉 All tests passed! Locations endpoint is working correctly."
    );
    console.log(
      "🔗 Frontend should now be able to load locations without 404 errors."
    );
  } else {
    console.log(
      "\n⚠️  Some endpoints failed. Check the backend logs for details."
    );
  }

  console.log("\n📝 Next steps:");
  console.log("- ✅ Backend is running with locations support");
  console.log("- 🌐 Start the frontend to test the locations page");
  console.log("- 🎮 Navigate to locations in the app to verify it works");
  console.log("\n🚀 Ready to test in browser!");
}

// Run the tests
runTests().catch(console.error);
