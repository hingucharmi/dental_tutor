# Phase 4 API Testing Guide

This document contains curl commands and test cases for all Phase 4 APIs.

**Base URL**: `http://localhost:3000`
**Note**: Replace `YOUR_TOKEN` with actual JWT token after login.

---

## Authentication Setup

First, get your authentication token:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save token to variable (PowerShell)
$TOKEN = "YOUR_JWT_TOKEN_HERE"

# Save token to variable (Bash)
export TOKEN="YOUR_JWT_TOKEN_HERE"
```

---

## 4.1 Recurring Appointments (Feature #9)

### Create Recurring Appointment
```bash
curl -X POST http://localhost:3000/api/recurring-appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "serviceId": 1,
    "dentistId": 1,
    "frequency": "monthly",
    "dayOfWeek": 1,
    "time": "10:00",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "notes": "Regular checkup"
  }'
```

### Get All Recurring Appointments
```bash
curl -X GET http://localhost:3000/api/recurring-appointments \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Recurring Appointment
```bash
curl -X GET http://localhost:3000/api/recurring-appointments/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update Recurring Appointment
```bash
curl -X PUT http://localhost:3000/api/recurring-appointments/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "paused",
    "endDate": "2024-06-30"
  }'
```

### Delete Recurring Appointment
```bash
curl -X DELETE http://localhost:3000/api/recurring-appointments/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.2 Symptom Assessment (Feature #12)

### Submit Symptom Assessment
```bash
curl -X POST http://localhost:3000/api/symptom-assessment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "symptoms": ["tooth pain", "swelling"],
    "severity": "moderate",
    "duration": "3 days",
    "location": "upper right molar",
    "additionalInfo": "Pain worsens when eating"
  }'
```

### Get Symptom Assessment History
```bash
curl -X GET http://localhost:3000/api/symptom-assessment \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Assessment
```bash
curl -X GET http://localhost:3000/api/symptom-assessment/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.3 Preparation Instructions (Feature #13)

### Get Preparation Instructions
```bash
curl -X GET http://localhost:3000/api/preparation-instructions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Instructions by Service ID
```bash
curl -X GET "http://localhost:3000/api/preparation-instructions?serviceId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Instruction
```bash
curl -X GET http://localhost:3000/api/preparation-instructions/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.4 Insurance Verification (Feature #14)

### Get Insurance Information
```bash
curl -X GET http://localhost:3000/api/insurance \
  -H "Authorization: Bearer $TOKEN"
```

### Verify Insurance Coverage
```bash
curl -X POST http://localhost:3000/api/insurance/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "insuranceProvider": "Blue Cross",
    "policyNumber": "BC123456789",
    "memberId": "MEMBER123",
    "dateOfBirth": "1990-01-01"
  }'
```

### Get Insurance Benefits
```bash
curl -X GET "http://localhost:3000/api/insurance/benefits?serviceId=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.5 Care Instructions (Feature #17)

### Get Care Instructions
```bash
curl -X GET http://localhost:3000/api/care-instructions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Care Instructions by Treatment Type
```bash
curl -X GET "http://localhost:3000/api/care-instructions?treatmentType=extraction" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Care Instruction
```bash
curl -X GET http://localhost:3000/api/care-instructions/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.6 Prescription Refills (Feature #18)

### Get All Prescriptions
```bash
curl -X GET http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Prescription
```bash
curl -X GET http://localhost:3000/api/prescriptions/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Request Prescription Refill
```bash
curl -X POST http://localhost:3000/api/prescriptions/refills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prescriptionId": 1,
    "pharmacyName": "CVS Pharmacy",
    "pharmacyPhone": "555-1234",
    "pharmacyAddress": "123 Main St",
    "notes": "Need refill as soon as possible"
  }'
```

### Get Refill History
```bash
curl -X GET http://localhost:3000/api/prescriptions/refills \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.7 Treatment Plan Details (Feature #19)

### Get All Treatment Plans
```bash
curl -X GET http://localhost:3000/api/treatment-plans \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Treatment Plan
```bash
curl -X GET http://localhost:3000/api/treatment-plans/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Treatment Plan Items
```bash
curl -X GET http://localhost:3000/api/treatment-plans/1/items \
  -H "Authorization: Bearer $TOKEN"
```

### Update Treatment Plan Progress
```bash
curl -X PUT http://localhost:3000/api/treatment-plans/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "in_progress",
    "progressPercentage": 50,
    "description": "Completed first phase"
  }'
```

**Status values**: `active`, `in_progress`, `completed`, `cancelled`, `on_hold`  
**Note**: Use `description` field for notes/comments (the table doesn't have a separate `notes` column)

---

## 4.8 Feedback & Reviews (Feature #20)

### Get All Reviews
```bash
curl -X GET http://localhost:3000/api/reviews \
  -H "Authorization: Bearer $TOKEN"
```

### Get Reviews by Dentist
```bash
curl -X GET "http://localhost:3000/api/reviews?dentistId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Submit Review
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": 1,
    "dentistId": 1,
    "rating": 5,
    "comment": "Excellent service! Very professional.",
    "recommend": true
  }'
```

### Get Single Review
```bash
curl -X GET http://localhost:3000/api/reviews/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update Review
```bash
curl -X PUT http://localhost:3000/api/reviews/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "rating": 4,
    "comment": "Updated comment"
  }'
```

**Note**: Users can only update their own reviews. Status updates require ownership.

### Delete Review
```bash
curl -X DELETE http://localhost:3000/api/reviews/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Note**: Users can only delete their own reviews.

---

## 4.9 Dentist Profiles (Feature #21)

### Get All Dentists
```bash
curl -X GET http://localhost:3000/api/dentists \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Dentist
```bash
curl -X GET http://localhost:3000/api/dentists/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Dentist Availability
```bash
# Get availability for a specific date
curl -X GET "http://localhost:3000/api/dentists/1/availability?date=2024-01-15" \
  -H "Authorization: Bearer $TOKEN"

# Get availability schedule (without specific date)
curl -X GET "http://localhost:3000/api/dentists/1/availability" \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes**:
- `availabilitySchedule`: Dentist's weekly schedule
- `availableSlots`: Available time slots for the requested date (if date provided)
- `bookedSlots`: Booked appointments for the requested date (if date provided)
- `totalAvailableSlots`: Count of available slots
- `totalBookedSlots`: Count of booked slots

---

## 4.10 Service Pricing (Feature #22)

### Get All Service Pricing
```bash
curl -X GET http://localhost:3000/api/service-pricing \
  -H "Authorization: Bearer $TOKEN"
```

### Get Pricing by Service
```bash
curl -X GET "http://localhost:3000/api/service-pricing?serviceId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Price Estimate
```bash
curl -X POST http://localhost:3000/api/service-pricing/estimate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "serviceId": 1,
    "insuranceId": 1,
    "hasInsurance": true
  }'
```

---

## 4.11 Dental Care Tips (Feature #24)

### Get All Dental Tips
```bash
curl -X GET http://localhost:3000/api/dental-tips \
  -H "Authorization: Bearer $TOKEN"
```

### Get Tips by Category
```bash
curl -X GET "http://localhost:3000/api/dental-tips?category=oral_hygiene" \
  -H "Authorization: Bearer $TOKEN"
```

### Search Tips
```bash
curl -X GET "http://localhost:3000/api/dental-tips?search=brushing" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Tip
```bash
curl -X GET http://localhost:3000/api/dental-tips/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.12 FAQ System (Feature #25)

### Get All FAQs
```bash
curl -X GET http://localhost:3000/api/faqs \
  -H "Authorization: Bearer $TOKEN"
```

### Get FAQs by Category
```bash
curl -X GET "http://localhost:3000/api/faqs?category=general" \
  -H "Authorization: Bearer $TOKEN"
```

### Search FAQs
```bash
curl -X GET "http://localhost:3000/api/faqs?search=appointment" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.13 Emergency Contact (Feature #26)

### Get Emergency Contacts
```bash
curl -X GET http://localhost:3000/api/emergency-contacts \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.14 Urgent Appointment Requests (Feature #27)

### Request Urgent Appointment
```bash
curl -X POST http://localhost:3000/api/urgent-appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "serviceId": 1,
    "preferredDate": "2024-01-15",
    "preferredTime": "10:00",
    "symptoms": "Severe tooth pain",
    "urgency": "high",
    "notes": "Cannot wait for regular appointment"
  }'
```

### Get Urgent Appointment Requests
```bash
curl -X GET http://localhost:3000/api/urgent-appointments \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Urgent Request
```bash
curl -X GET http://localhost:3000/api/urgent-appointments/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.15 Pain Management Guidance (Feature #28)

### Get Pain Management Content
```bash
curl -X GET http://localhost:3000/api/pain-management \
  -H "Authorization: Bearer $TOKEN"
```

### Get Content by Pain Level
```bash
curl -X GET "http://localhost:3000/api/pain-management?level=moderate" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Content Item
```bash
curl -X GET http://localhost:3000/api/pain-management/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.16 Profile Management (Feature #29)

### Get User Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Update User Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-1234",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }'
```

---

## 4.17 Insurance Information Management (Feature #31)

### Get Insurance Information
```bash
curl -X GET http://localhost:3000/api/insurance \
  -H "Authorization: Bearer $TOKEN"
```

### Add/Update Insurance Information
```bash
curl -X POST http://localhost:3000/api/insurance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "providerName": "Blue Cross Blue Shield",
    "policyNumber": "BC123456789",
    "memberId": "MEMBER123",
    "groupNumber": "GRP456",
    "primaryHolderName": "John Doe",
    "relationship": "self",
    "effectiveDate": "2024-01-01",
    "expirationDate": "2024-12-31"
  }'
```

### Update Insurance Information
```bash
curl -X PUT http://localhost:3000/api/insurance/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "policyNumber": "BC987654321",
    "expirationDate": "2025-12-31"
  }'
```

---

## 4.18 Family Account Management (Feature #32)

### Get Family Members
```bash
curl -X GET http://localhost:3000/api/family-members \
  -H "Authorization: Bearer $TOKEN"
```

### Add Family Member
```bash
curl -X POST http://localhost:3000/api/family-members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "dateOfBirth": "2010-05-15",
    "relationship": "child",
    "phone": "555-5678",
    "email": "jane@example.com"
  }'
```

### Get Single Family Member
```bash
curl -X GET http://localhost:3000/api/family-members/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update Family Member
```bash
curl -X PUT http://localhost:3000/api/family-members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone": "555-9999",
    "email": "jane.updated@example.com"
  }'
```

### Delete Family Member
```bash
curl -X DELETE http://localhost:3000/api/family-members/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.19 Appointment Confirmations (Feature #34)

### Get Appointment Confirmation
```bash
curl -X GET http://localhost:3000/api/appointments/1/confirmation \
  -H "Authorization: Bearer $TOKEN"
```

### Resend Confirmation
```bash
curl -X POST http://localhost:3000/api/appointments/1/confirmation/resend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "channels": ["email", "sms"]
  }'
```

---

## 4.20 Weather/Closure Alerts (Feature #35)

### Get All Alerts
```bash
curl -X GET http://localhost:3000/api/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### Get Active Alerts
```bash
curl -X GET "http://localhost:3000/api/alerts?status=active" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Alert
```bash
curl -X GET http://localhost:3000/api/alerts/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.21 Promotional Offers (Feature #36)

### Get All Promotional Offers
```bash
curl -X GET http://localhost:3000/api/promotional-offers \
  -H "Authorization: Bearer $TOKEN"
```

### Get Active Offers
```bash
curl -X GET "http://localhost:3000/api/promotional-offers?status=active" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Offer
```bash
curl -X GET http://localhost:3000/api/promotional-offers/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Redeem Offer
```bash
curl -X POST http://localhost:3000/api/promotional-offers/1/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": 1
  }'
```

---

## Testing Scripts

### PowerShell Test Script

```powershell
# Set base URL and token
$baseUrl = "http://localhost:3000"
$token = "YOUR_TOKEN_HERE"

# Function to make authenticated requests
function Invoke-AuthenticatedRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $params = @{
        Uri = "$baseUrl$Endpoint"
        Method = $Method
        Headers = $headers
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json)
    }
    
    try {
        $response = Invoke-RestMethod @params
        Write-Host "✓ $Method $Endpoint - Success" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "✗ $Method $Endpoint - Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test all Phase 4 APIs
Write-Host "`n=== Testing Phase 4 APIs ===`n" -ForegroundColor Cyan

# Recurring Appointments
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/recurring-appointments"

# Symptom Assessment
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/symptom-assessment"

# Preparation Instructions
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/preparation-instructions"

# Insurance
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/insurance"

# Care Instructions
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/care-instructions"

# Prescriptions
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/prescriptions"

# Treatment Plans
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/treatment-plans"

# Reviews
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/reviews"

# Dentists
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/dentists"

# Service Pricing
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/service-pricing"

# Dental Tips
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/dental-tips"

# FAQs
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/faqs"

# Emergency Contacts
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/emergency-contacts"

# Urgent Appointments
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/urgent-appointments"

# Pain Management
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/pain-management"

# User Profile
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/users/profile"

# Family Members
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/family-members"

# Alerts
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/alerts"

# Promotional Offers
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/api/promotional-offers"

Write-Host "`n=== Testing Complete ===`n" -ForegroundColor Cyan
```

### Bash Test Script

```bash
#!/bin/bash

# Set base URL and token
BASE_URL="http://localhost:3000"
TOKEN="YOUR_TOKEN_HERE"

# Function to make authenticated requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "✓ $method $endpoint - Success ($http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "✗ $method $endpoint - Failed ($http_code)"
        echo "$body"
    fi
    echo ""
}

# Test all Phase 4 APIs
echo "=== Testing Phase 4 APIs ==="
echo ""

# Recurring Appointments
make_request "GET" "/api/recurring-appointments"

# Symptom Assessment
make_request "GET" "/api/symptom-assessment"

# Preparation Instructions
make_request "GET" "/api/preparation-instructions"

# Insurance
make_request "GET" "/api/insurance"

# Care Instructions
make_request "GET" "/api/care-instructions"

# Prescriptions
make_request "GET" "/api/prescriptions"

# Treatment Plans
make_request "GET" "/api/treatment-plans"

# Reviews
make_request "GET" "/api/reviews"

# Dentists
make_request "GET" "/api/dentists"

# Service Pricing
make_request "GET" "/api/service-pricing"

# Dental Tips
make_request "GET" "/api/dental-tips"

# FAQs
make_request "GET" "/api/faqs"

# Emergency Contacts
make_request "GET" "/api/emergency-contacts"

# Urgent Appointments
make_request "GET" "/api/urgent-appointments"

# Pain Management
make_request "GET" "/api/pain-management"

# User Profile
make_request "GET" "/api/users/profile"

# Family Members
make_request "GET" "/api/family-members"

# Alerts
make_request "GET" "/api/alerts"

# Promotional Offers
make_request "GET" "/api/promotional-offers"

echo "=== Testing Complete ==="
```

---

## Notes

1. **Authentication**: Most endpoints require authentication. Use the token from login.
2. **Error Handling**: Check HTTP status codes:
   - `200-299`: Success
   - `400`: Bad Request (validation error)
   - `401`: Unauthorized (invalid/missing token)
   - `403`: Forbidden (insufficient permissions)
   - `404`: Not Found
   - `500`: Internal Server Error
3. **Response Format**: All responses follow this structure:
   ```json
   {
     "success": true/false,
     "data": { ... },
     "error": "error message if failed"
   }
   ```
4. **Testing Order**: Some endpoints depend on data created by others. Test in this order:
   - Authentication
   - Profile/User data
   - Appointments
   - Related features (prescriptions, treatment plans, etc.)

---

## Quick Test Checklist

- [ ] Recurring Appointments - GET, POST, PUT, DELETE
- [ ] Symptom Assessment - POST, GET
- [ ] Preparation Instructions - GET
- [ ] Insurance - GET, POST, PUT
- [ ] Care Instructions - GET
- [ ] Prescriptions - GET, POST (refills)
- [ ] Treatment Plans - GET, PUT
- [ ] Reviews - GET, POST
- [ ] Dentists - GET
- [ ] Service Pricing - GET, POST (estimate)
- [ ] Dental Tips - GET
- [ ] FAQs - GET
- [ ] Emergency Contacts - GET
- [ ] Urgent Appointments - GET, POST
- [ ] Pain Management - GET
- [ ] User Profile - GET, PUT
- [ ] Family Members - GET, POST, PUT, DELETE
- [ ] Alerts - GET
- [ ] Promotional Offers - GET, POST (redeem)

