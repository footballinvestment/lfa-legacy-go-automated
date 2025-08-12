#!/bin/bash
# === backend/run_fixed_test.sh ===
# TELJES ÚJ FÁJL - Automated Test Runner with Cleanup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
DATABASE_PATH="./lfa_legacy_go.db"

echo -e "${BLUE}🚀 LFA Legacy GO - Fixed Test Runner${NC}"
echo "=========================================="

# Function to check if backend is running
check_backend() {
    echo -e "${YELLOW}🔍 Checking backend status...${NC}"
    
    if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running at $BACKEND_URL${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend is not running at $BACKEND_URL${NC}"
        echo "Please start the backend first:"
        echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
        return 1
    fi
}

# Function to check database
check_database() {
    echo -e "${YELLOW}🗃️ Checking database...${NC}"
    
    if [ ! -f "$DATABASE_PATH" ]; then
        echo -e "${RED}❌ Database file not found: $DATABASE_PATH${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Database file exists${NC}"
    return 0
}

# Function to run cleanup
run_cleanup() {
    echo -e "${YELLOW}🧹 Running database cleanup...${NC}"
    
    if [ -f "test_cleanup.py" ]; then
        if python test_cleanup.py --reset-counters; then
            echo -e "${GREEN}✅ Database cleanup completed${NC}"
        else
            echo -e "${YELLOW}⚠️ Cleanup encountered issues but continuing...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ test_cleanup.py not found, skipping cleanup${NC}"
    fi
}

# Function to run the test
run_test() {
    echo -e "${YELLOW}🧪 Running fixed mega test...${NC}"
    
    if [ ! -f "working_mega_test.py" ]; then
        echo -e "${RED}❌ working_mega_test.py not found${NC}"
        return 1
    fi
    
    # Set test environment
    export TEST_MODE=true
    export DEBUG=true
    
    echo -e "${BLUE}Environment:${NC}"
    echo "  TEST_MODE=$TEST_MODE"
    echo "  DEBUG=$DEBUG"
    echo "  Target URL: $BACKEND_URL"
    echo ""
    
    # Run the test
    if python working_mega_test.py; then
        echo -e "${GREEN}✅ Test completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Test failed${NC}"
        return 1
    fi
}

# Function to show test results
show_results() {
    echo -e "${BLUE}📊 Test Results Summary:${NC}"
    
    # Find the latest test report
    LATEST_REPORT=$(ls -t working_mega_test_*.json 2>/dev/null | head -1)
    
    if [ -n "$LATEST_REPORT" ] && [ -f "$LATEST_REPORT" ]; then
        echo "Latest report: $LATEST_REPORT"
        
        # Extract key metrics using Python
        if command -v python3 >/dev/null 2>&1; then
            python3 << EOF
import json
try:
    with open('$LATEST_REPORT', 'r') as f:
        data = json.load(f)
    
    total = data.get('total_tests', 0)
    passed = data.get('passed_tests', 0)
    failed = data.get('failed_tests', 0)
    success_rate = data.get('success_rate', 0)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 75:
        print("🎉 EXCELLENT - Test goals achieved!")
    elif success_rate >= 60:
        print("✅ GOOD - Most features working")
    elif success_rate >= 30:
        print("⚠️ NEEDS WORK - Significant issues")
    else:
        print("❌ CRITICAL - Major problems")
        
except Exception as e:
    print(f"Could not parse report: {e}")
EOF
        else
            echo "Python not available for detailed analysis"
        fi
    else
        echo "No test report found"
    fi
}

# Function to cleanup on exit
cleanup_on_exit() {
    echo -e "\n${YELLOW}🧽 Cleaning up...${NC}"
    # Unset environment variables
    unset TEST_MODE
    unset DEBUG
}

# Trap to cleanup on exit
trap cleanup_on_exit EXIT

# Main execution
main() {
    echo -e "${BLUE}Starting test sequence...${NC}"
    echo ""
    
    # Pre-flight checks
    if ! check_backend; then
        exit 1
    fi
    
    if ! check_database; then
        exit 1
    fi
    
    # Run cleanup
    run_cleanup
    echo ""
    
    # Run test
    if run_test; then
        echo ""
        show_results
        echo ""
        echo -e "${GREEN}🎯 Test execution completed successfully!${NC}"
        exit 0
    else
        echo ""
        show_results
        echo ""
        echo -e "${RED}💥 Test execution failed!${NC}"
        echo -e "${YELLOW}Try the following:${NC}"
        echo "1. Check backend logs for errors"
        echo "2. Run manual cleanup: python test_cleanup.py"
        echo "3. Restart backend and try again"
        exit 1
    fi
}

# Help function
show_help() {
    echo "LFA Legacy GO - Fixed Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --cleanup  Run cleanup only (no test)"
    echo "  -t, --test     Run test only (no cleanup)"
    echo "  -v, --verbose  Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0              # Run full sequence (cleanup + test)"
    echo "  $0 --cleanup    # Run cleanup only"
    echo "  $0 --test       # Run test only"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -c|--cleanup)
        echo -e "${BLUE}🧹 Cleanup Mode${NC}"
        check_database
        run_cleanup
        echo -e "${GREEN}✅ Cleanup completed${NC}"
        exit 0
        ;;
    -t|--test)
        echo -e "${BLUE}🧪 Test Only Mode${NC}"
        check_backend
        check_database
        if run_test; then
            show_results
            exit 0
        else
            show_results
            exit 1
        fi
        ;;
    -v|--verbose)
        echo -e "${BLUE}🔊 Verbose Mode${NC}"
        set -x  # Enable verbose output
        main
        ;;
    "")
        # No arguments - run full sequence
        main
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac