#!/bin/bash

# Phase 4 API Testing Script for Bash
# Usage: ./scripts/test-phase4-apis.sh [TOKEN] [BASE_URL]

TOKEN="${1:-}"
BASE_URL="${2:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Function to make authenticated requests
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓${NC} $method $endpoint"
        if [ ! -z "$description" ]; then
            echo -e "  ${GRAY}$description${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $method $endpoint - HTTP $http_code"
        if [ ! -z "$description" ]; then
            echo -e "  ${GRAY}$description${NC}"
        fi
        echo -e "  ${RED}Error: $body${NC}"
        return 1
    fi
}

# Try to login if token not provided
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}Token not provided. Attempting to login...${NC}"
    
    login_response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password123"}' 2>&1)
    
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ Login failed${NC}"
        echo -e "${YELLOW}Please provide token manually: ./scripts/test-phase4-apis.sh YOUR_TOKEN${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Login successful!${NC}"
    fi
fi

echo -e "\n${CYAN}=== Testing Phase 4 APIs ===${NC}"
echo -e "${GRAY}Base URL: $BASE_URL\n${NC}"

TOTAL=0
PASSED=0
FAILED=0

# 4.1 Recurring Appointments
echo -e "\n${YELLOW}[4.1] Recurring Appointments${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/recurring-appointments" "Get all recurring appointments" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.2 Symptom Assessment
echo -e "\n${YELLOW}[4.2] Symptom Assessment${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/symptom-assessment" "Get symptom assessment history" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.3 Preparation Instructions
echo -e "\n${YELLOW}[4.3] Preparation Instructions${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/preparation-instructions" "Get all preparation instructions" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.4 Insurance Verification
echo -e "\n${YELLOW}[4.4] Insurance Verification${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/insurance" "Get insurance information" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.5 Care Instructions
echo -e "\n${YELLOW}[4.5] Care Instructions${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/care-instructions" "Get care instructions" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.6 Prescription Refills
echo -e "\n${YELLOW}[4.6] Prescription Refills${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/prescriptions" "Get all prescriptions" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/prescriptions/refills" "Get refill history" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.7 Treatment Plan Details
echo -e "\n${YELLOW}[4.7] Treatment Plan Details${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/treatment-plans" "Get all treatment plans" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.8 Feedback & Reviews
echo -e "\n${YELLOW}[4.8] Feedback & Reviews${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/reviews" "Get all reviews" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.9 Dentist Profiles
echo -e "\n${YELLOW}[4.9] Dentist Profiles${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/dentists" "Get all dentists" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.10 Service Pricing
echo -e "\n${YELLOW}[4.10] Service Pricing${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/service-pricing" "Get service pricing" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.11 Dental Care Tips
echo -e "\n${YELLOW}[4.11] Dental Care Tips${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/dental-tips" "Get dental care tips" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.12 FAQ System
echo -e "\n${YELLOW}[4.12] FAQ System${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/faqs" "Get all FAQs" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.13 Emergency Contact
echo -e "\n${YELLOW}[4.13] Emergency Contact${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/emergency-contacts" "Get emergency contacts" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.14 Urgent Appointment Requests
echo -e "\n${YELLOW}[4.14] Urgent Appointment Requests${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/urgent-appointments" "Get urgent appointment requests" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.15 Pain Management Guidance
echo -e "\n${YELLOW}[4.15] Pain Management Guidance${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/pain-management" "Get pain management content" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.16 Profile Management
echo -e "\n${YELLOW}[4.16] Profile Management${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/users/profile" "Get user profile" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.17 Insurance Information Management
echo -e "\n${YELLOW}[4.17] Insurance Information Management${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/insurance" "Get insurance information" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.18 Family Account Management
echo -e "\n${YELLOW}[4.18] Family Account Management${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/family-members" "Get family members" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.19 Appointment Confirmations
echo -e "\n${YELLOW}[4.19] Appointment Confirmations${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/appointments/upcoming" "Get upcoming appointments" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.20 Weather/Closure Alerts
echo -e "\n${YELLOW}[4.20] Weather/Closure Alerts${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/alerts" "Get all alerts" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# 4.21 Promotional Offers
echo -e "\n${YELLOW}[4.21] Promotional Offers${NC}"
TOTAL=$((TOTAL + 1))
test_endpoint "GET" "/api/promotional-offers" "Get promotional offers" && PASSED=$((PASSED + 1)) || FAILED=$((FAILED + 1))

# Summary
echo -e "\n${CYAN}=== Test Summary ===${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
    success_rate=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
    echo -e "Success Rate: ${success_rate}%"
    
    if [ $FAILED -gt 0 ]; then
        echo -e "\n${YELLOW}Some tests failed. Check the errors above.${NC}"
        exit 1
    else
        echo -e "\n${GREEN}All tests passed! ✓${NC}"
        exit 0
    fi
else
    exit 1
fi

