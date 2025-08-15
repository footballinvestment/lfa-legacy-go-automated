#!/bin/bash
# === LFA Legacy GO - COMPREHENSIVE DEPLOYMENT VALIDATION ===
# Advanced testing and validation suite for Cloud Run deployment

set -e

# Colors and symbols
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="✅"
ERROR="❌"
WARNING="⚠️"
INFO="ℹ️"
TEST="🧪"
MONITOR="📊"
ROCKET="🚀"

print_header() { echo -e "${PURPLE}${ROCKET} $1${NC}"; }
print_test() { echo -e "${BLUE}${TEST} $1${NC}"; }
print_success() { echo -e "${GREEN}${CHECK} $1${NC}"; }
print_error() { echo -e "${RED}${ERROR} $1${NC}"; }
print_warning() { echo -e "${YELLOW}${WARNING} $1${NC}"; }
print_info() { echo -e "${CYAN}${INFO} $1${NC}"; }
print_monitor() { echo -e "${YELLOW}${MONITOR} $1${NC}"; }

# Configuration
PROJECT_ID="lfa-legacy-go"
SERVICE_NAME="lfa-legacy-go-backend"
REGION="us-central1"

# Add gcloud to PATH
export PATH="/Users/lovas.zoltan/google-cloud-sdk/bin:$PATH"

print_header "COMPREHENSIVE DEPLOYMENT VALIDATION SUITE"
echo "============================================================="

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ]; then
    print_error "Service not found or not deployed!"
    print_info "Please run deployment first: ./ULTIMATE_DEPLOY.sh"
    exit 1
fi

print_info "Testing service: $SERVICE_URL"
echo "============================================================="

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "Test $TOTAL_TESTS: $test_name"
    
    if eval "$test_command"; then
        if [ -n "$expected_result" ]; then
            if [[ "$?" == "$expected_result" ]]; then
                print_success "PASSED"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                print_error "FAILED - Unexpected result"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            print_success "PASSED"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        print_error "FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Test Suite 1: Basic Connectivity
print_header "Test Suite 1: Basic Connectivity"

run_test "Root endpoint connectivity" \
    "curl -s -o /dev/null -w '%{http_code}' '$SERVICE_URL/' | grep -q '200'"

run_test "Health endpoint connectivity" \
    "curl -s -o /dev/null -w '%{http_code}' '$SERVICE_URL/health' | grep -q '200'"

run_test "API documentation accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' '$SERVICE_URL/docs' | grep -q '200'"

run_test "OpenAPI specification accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' '$SERVICE_URL/openapi.json' | grep -q '200'"

# Test Suite 2: API Response Validation
print_header "Test Suite 2: API Response Validation"

run_test "Root endpoint JSON response" \
    "curl -s '$SERVICE_URL/' | jq -e '.message' > /dev/null"

run_test "Health endpoint status field" \
    "curl -s '$SERVICE_URL/health' | jq -e '.status' | grep -q 'healthy'"

run_test "Health endpoint platform field" \
    "curl -s '$SERVICE_URL/health' | jq -e '.platform' | grep -q 'google_cloud_run'"

run_test "Root endpoint version field" \
    "curl -s '$SERVICE_URL/' | jq -e '.version' > /dev/null"

# Test Suite 3: Router Validation
print_header "Test Suite 3: Router Validation"

# Get router count from health endpoint
ROUTER_COUNT=$(curl -s "$SERVICE_URL/health" | jq -r '.routers_active' 2>/dev/null || echo "0")

run_test "Router loading validation" \
    "[ '$ROUTER_COUNT' -eq 10 ]"

print_info "Detected $ROUTER_COUNT/10 active routers"

# Test individual router endpoints
declare -a ROUTERS=("auth" "credits" "social" "locations" "booking" "tournaments" "weather" "game-results" "admin" "health")

for router in "${ROUTERS[@]}"; do
    run_test "Router endpoint: /api/$router" \
        "curl -s -o /dev/null -w '%{http_code}' '$SERVICE_URL/api/$router' | grep -qE '^[2-4][0-9][0-9]$'"
done

# Test Suite 4: Performance and Load Testing
print_header "Test Suite 4: Performance Testing"

run_test "Response time under 2 seconds" \
    "response_time=\$(curl -s -o /dev/null -w '%{time_total}' '$SERVICE_URL/health'); (( \$(echo \"\$response_time < 2.0\" | bc -l) ))"

run_test "Concurrent request handling (5 requests)" \
    "for i in {1..5}; do curl -s '$SERVICE_URL/health' > /dev/null & done; wait"

run_test "Large response handling (API docs)" \
    "gtimeout 10s curl -s '$SERVICE_URL/docs' > /dev/null"

# Test Suite 5: CORS Configuration
print_header "Test Suite 5: CORS Configuration"

run_test "CORS headers present" \
    "curl -s -H 'Origin: https://glittering-unicorn-b00443.netlify.app' -I '$SERVICE_URL/health' | grep -qi 'access-control-allow-origin'"

run_test "Preflight OPTIONS request" \
    "curl -s -X OPTIONS -H 'Origin: https://glittering-unicorn-b00443.netlify.app' -o /dev/null -w '%{http_code}' '$SERVICE_URL/health' | grep -q '200'"

# Test Suite 6: Environment Configuration
print_header "Test Suite 6: Environment Configuration"

HEALTH_DATA=$(curl -s "$SERVICE_URL/health")

run_test "Production environment configured" \
    "echo '$HEALTH_DATA' | jq -e '.environment' | grep -q 'production'"

run_test "Service name configuration" \
    "echo '$HEALTH_DATA' | jq -e '.service_name' > /dev/null"

run_test "Cloud Run revision info" \
    "echo '$HEALTH_DATA' | jq -e '.revision' > /dev/null"

# Test Suite 7: Security Validation
print_header "Test Suite 7: Security Validation"

run_test "HTTPS enforcement" \
    "echo '$SERVICE_URL' | grep -q '^https://'"

run_test "Security headers present" \
    "curl -s -I '$SERVICE_URL/' | grep -qi 'x-'"

run_test "No sensitive information in responses" \
    "! curl -s '$SERVICE_URL/' | grep -qi 'secret\\|password\\|key'"

# Test Suite 8: Database Persistence Validation
print_header "Test Suite 8: Database Persistence Validation"

run_test "Database connection status" \
    "curl -s '$SERVICE_URL/health' | jq -e '.database' | grep -q 'connected'"

run_test "PostgreSQL database verification" \
    "curl -s '$SERVICE_URL/health' | jq -e '.database_type' | grep -qi 'postgresql'"

if curl -s "$SERVICE_URL/health" | jq -e '.database_type' | grep -qi 'postgresql'; then
    print_success "PostgreSQL detected - persistent storage enabled"
else
    print_warning "SQLite detected - data persistence risk on restart"
    
    run_test "SQLite data loss warning present" \
        "curl -s '$SERVICE_URL/health' | jq -e '.database_warning' > /dev/null"
fi

run_test "Database tables initialization" \
    "curl -s '$SERVICE_URL/health' | jq -e '.database_tables' > /dev/null"

# Generate Validation Report
print_header "VALIDATION REPORT GENERATION"

cat > deployment-validation-report.txt << EOF
LFA Legacy GO - Deployment Validation Report
===========================================
Validation Date: $(date)
Service URL: $SERVICE_URL
Total Tests: $TOTAL_TESTS
Passed Tests: $PASSED_TESTS
Failed Tests: $FAILED_TESTS
Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%

DETAILED RESULTS:
================
✅ Basic Connectivity: $(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/")
✅ Health Check: $(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health")
✅ API Documentation: $(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/docs")
✅ Active Routers: $ROUTER_COUNT/10

PERFORMANCE METRICS:
===================
Response Time: $(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/health")s
DNS Resolution: $(curl -s -o /dev/null -w "%{time_namelookup}" "$SERVICE_URL/health")s
Connection Time: $(curl -s -o /dev/null -w "%{time_connect}" "$SERVICE_URL/health")s

HEALTH CHECK DETAILS:
====================
$(curl -s "$SERVICE_URL/health" | jq '.')

RECOMMENDATIONS:
===============
$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed! Deployment is fully functional."
    echo "✅ Service is ready for production use."
    echo "✅ Frontend integration can proceed."
else
    echo "⚠️ Some tests failed. Review the issues above."
    echo "🔧 Check service logs: gcloud logging read \"resource.type=\\\"cloud_run_revision\\\"\" --limit=50"
    echo "🔄 Consider redeploying if critical issues are found."
fi)

EOF

print_success "Validation report saved: deployment-validation-report.txt"

# Final Results
echo ""
echo "============================================================="
if [ $FAILED_TESTS -eq 0 ]; then
    print_header "🎉 ALL VALIDATION TESTS PASSED!"
    print_success "Deployment is fully functional and ready for production!"
else
    print_header "⚠️ VALIDATION COMPLETED WITH ISSUES"
    print_warning "$FAILED_TESTS out of $TOTAL_TESTS tests failed"
fi
echo "============================================================="
echo "📊 Test Results: $PASSED_TESTS passed, $FAILED_TESTS failed"
echo "✅ Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"
echo "📋 Full report: deployment-validation-report.txt"
echo "============================================================="

exit $FAILED_TESTS