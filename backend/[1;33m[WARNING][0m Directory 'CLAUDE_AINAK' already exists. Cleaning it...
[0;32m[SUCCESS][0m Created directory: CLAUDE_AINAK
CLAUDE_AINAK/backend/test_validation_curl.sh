#!/bin/bash
# Game Result Validation Fix Verification - cURL version
# 🔧 KRITIKUS VALIDÁCIÓS TESZTEK - PHANTOM SUCCESS MEGOLDÁS

BASE_URL="http://localhost:8000/api"
TOKEN=""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔧 GAME RESULT VALIDATION FIX - TEST SUITE"
echo "=========================================="
echo "Test started at: $(date)"
echo "Backend URL: $BASE_URL"
echo

# Function to get auth token
get_auth_token() {
    echo "🔐 Getting authentication token..."
    
    # Try different test users
    users=("p3t1k3:Pass123" "admin:Pass123" "testregular:Pass123")
    
    for user in "${users[@]}"; do
        username=$(echo $user | cut -d: -f1)
        password=$(echo $user | cut -d: -f2)
        
        echo "Trying user: $username"
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X POST "$BASE_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"username\":\"$username\",\"password\":\"$password\"}")
        
        http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
        
        if [ "$http_status" -eq 200 ]; then
            TOKEN=$(echo $body | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
            if [ ! -z "$TOKEN" ]; then
                echo -e "${GREEN}✅ Authenticated as $username${NC}"
                return 0
            fi
        fi
    done
    
    echo -e "${RED}❌ Failed to authenticate with any test user${NC}"
    return 1
}

# Function to run a test
run_test() {
    local test_name="$1"
    local json_data="$2"
    local should_pass="$3"
    local expected_error="$4"
    
    echo -e "\n${BLUE}Test: $test_name${NC}"
    echo "Data: $json_data"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$BASE_URL/game-results/submit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$json_data")
    
    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    echo "Response status: $http_status"
    
    if [ "$should_pass" = "true" ]; then
        if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 201 ]; then
            echo -e "  ${GREEN}✅ PASS - Valid data accepted${NC}"
            
            # Check for auto-calculation
            auto_result=$(echo $body | grep -o '"auto_calculated_result":"[^"]*' | cut -d'"' -f4)
            if [ ! -z "$auto_result" ]; then
                echo "  📊 Auto-calculated result: $auto_result"
            fi
            
            return 0
        else
            echo -e "  ${RED}❌ FAIL - Valid data rejected${NC}"
            echo "    Response: $body"
            return 1
        fi
    else
        if [ "$http_status" -eq 422 ]; then
            echo -e "  ${GREEN}✅ PASS - Invalid data properly rejected${NC}"
            
            if [ ! -z "$expected_error" ]; then
                if echo "$body" | grep -q "$expected_error"; then
                    echo "  📝 Correct error message contains: $expected_error"
                else
                    echo "  📝 Error response: $body"
                fi
            else
                echo "  📝 Error response: $body"
            fi
            
            return 0
        else
            echo -e "  ${RED}❌ FAIL - Invalid data accepted (status: $http_status)${NC}"
            echo "    Response: $body"
            return 1
        fi
    fi
}

# Main test execution
main() {
    # Get authentication token
    if ! get_auth_token; then
        echo -e "${YELLOW}⚠️ Authentication failed, proceeding with validation tests anyway${NC}"
        echo -e "${YELLOW}   (Some tests may fail due to auth, but validation logic can still be tested)${NC}"
        TOKEN=""
    fi
    
    echo -e "\n📊 Running validation tests..."
    echo "==============================="
    
    local passed=0
    local failed=0
    
    # Test 1: Valid scores (should pass)
    if run_test "✅ Valid scores (should pass)" \
        '{"user_id":1,"session_id":"test_001","my_score":25,"opponent_score":18,"duration_minutes":90,"performance_percentage":75.5}' \
        "true"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Test 2: Negative my_score (should fail)
    if run_test "❌ Negative my_score (should fail)" \
        '{"user_id":1,"session_id":"test_002","my_score":-10,"opponent_score":20,"duration_minutes":90,"performance_percentage":75.5}' \
        "false" "cannot be negative"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Test 3: Score too high (should fail)
    if run_test "❌ Score too high (should fail)" \
        '{"user_id":1,"session_id":"test_003","my_score":150,"opponent_score":20,"duration_minutes":90,"performance_percentage":75.5}' \
        "false" "cannot exceed 99"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Test 4: Negative duration (should fail)
    if run_test "❌ Negative duration (should fail)" \
        '{"user_id":1,"session_id":"test_004","my_score":25,"opponent_score":18,"duration_minutes":-88,"performance_percentage":75.5}' \
        "false" "Duration must be positive"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Test 5: Duration too long (should fail)
    if run_test "❌ Duration too long (should fail)" \
        '{"user_id":1,"session_id":"test_005","my_score":25,"opponent_score":18,"duration_minutes":500,"performance_percentage":75.5}' \
        "false" "cannot exceed 5 hours"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Test 6: Edge case - min values (should pass)
    if run_test "✅ Edge case: Min values (should pass)" \
        '{"user_id":1,"session_id":"test_006","my_score":0,"opponent_score":0,"duration_minutes":1,"performance_percentage":0.0}' \
        "true"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Test 7: Edge case - max values (should pass)
    if run_test "✅ Edge case: Max values (should pass)" \
        '{"user_id":1,"session_id":"test_007","my_score":99,"opponent_score":99,"duration_minutes":300,"performance_percentage":100.0}' \
        "true"; then
        ((passed++))
    else
        ((failed++))
    fi
    
    echo
    echo "==============================="
    echo "📈 TEST RESULTS:"
    echo -e "✅ Passed: ${GREEN}$passed${NC}"
    echo -e "❌ Failed: ${RED}$failed${NC}"
    
    local total=$((passed + failed))
    if [ $total -gt 0 ]; then
        local success_rate=$((passed * 100 / total))
        echo "📊 Success rate: $success_rate%"
    fi
    
    echo
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL VALIDATION TESTS PASSED!${NC}"
        echo -e "${GREEN}✅ Phantom success problem is SOLVED!${NC}"
        return 0
    else
        echo -e "${RED}🚨 SOME TESTS FAILED - Validation needs fixing${NC}"
        return 1
    fi
}

# Run the tests
main