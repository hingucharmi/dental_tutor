# Phase 4 API Testing Script for PowerShell
# Usage: .\scripts\test-phase4-apis.ps1 -Token "YOUR_JWT_TOKEN"

param(
    [Parameter(Mandatory=$false)]
    [string]$Token = "",
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "Token not provided. Attempting to login..." -ForegroundColor Yellow
    
    # Try to login (adjust credentials as needed)
    $loginBody = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -ErrorAction Stop
        
        if ($loginResponse.token) {
            $Token = $loginResponse.token
            Write-Host "✓ Login successful!" -ForegroundColor Green
        } else {
            Write-Host "✗ Login failed: No token received" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please provide token manually: .\scripts\test-phase4-apis.ps1 -Token 'YOUR_TOKEN'" -ForegroundColor Yellow
        exit 1
    }
}

# Function to make authenticated requests
function Test-ApiEndpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description = ""
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $params = @{
        Uri = "$BaseUrl$Endpoint"
        Method = $Method
        Headers = $headers
        ErrorAction = "Stop"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        Write-Host "✓ $Method $Endpoint" -ForegroundColor Green
        if ($Description) {
            Write-Host "  $Description" -ForegroundColor Gray
        }
        return @{ Success = $true; Response = $response }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "✗ $Method $Endpoint - HTTP $statusCode" -ForegroundColor Red
        if ($Description) {
            Write-Host "  $Description" -ForegroundColor Gray
        }
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

Write-Host "`n=== Testing Phase 4 APIs ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Gray

$results = @{
    Total = 0
    Passed = 0
    Failed = 0
}

# 4.1 Recurring Appointments
Write-Host "`n[4.1] Recurring Appointments" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/recurring-appointments" -Description "Get all recurring appointments"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.2 Symptom Assessment
Write-Host "`n[4.2] Symptom Assessment" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/symptom-assessment" -Description "Get symptom assessment history"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.3 Preparation Instructions
Write-Host "`n[4.3] Preparation Instructions" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/preparation-instructions" -Description "Get all preparation instructions"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.4 Insurance Verification
Write-Host "`n[4.4] Insurance Verification" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/insurance" -Description "Get insurance information"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.5 Care Instructions
Write-Host "`n[4.5] Care Instructions" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/care-instructions" -Description "Get care instructions"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.6 Prescription Refills
Write-Host "`n[4.6] Prescription Refills" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/prescriptions" -Description "Get all prescriptions"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/prescriptions/refills" -Description "Get refill history"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.7 Treatment Plan Details
Write-Host "`n[4.7] Treatment Plan Details" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/treatment-plans" -Description "Get all treatment plans"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.8 Feedback & Reviews
Write-Host "`n[4.8] Feedback & Reviews" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/reviews" -Description "Get all reviews"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.9 Dentist Profiles
Write-Host "`n[4.9] Dentist Profiles" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/dentists" -Description "Get all dentists"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.10 Service Pricing
Write-Host "`n[4.10] Service Pricing" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/service-pricing" -Description "Get service pricing"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.11 Dental Care Tips
Write-Host "`n[4.11] Dental Care Tips" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/dental-tips" -Description "Get dental care tips"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.12 FAQ System
Write-Host "`n[4.12] FAQ System" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/faqs" -Description "Get all FAQs"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.13 Emergency Contact
Write-Host "`n[4.13] Emergency Contact" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/emergency-contacts" -Description "Get emergency contacts"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.14 Urgent Appointment Requests
Write-Host "`n[4.14] Urgent Appointment Requests" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/urgent-appointments" -Description "Get urgent appointment requests"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.15 Pain Management Guidance
Write-Host "`n[4.15] Pain Management Guidance" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/pain-management" -Description "Get pain management content"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.16 Profile Management
Write-Host "`n[4.16] Profile Management" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/users/profile" -Description "Get user profile"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.17 Insurance Information Management
Write-Host "`n[4.17] Insurance Information Management" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/insurance" -Description "Get insurance information"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.18 Family Account Management
Write-Host "`n[4.18] Family Account Management" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/family-members" -Description "Get family members"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.19 Appointment Confirmations (if endpoint exists)
Write-Host "`n[4.19] Appointment Confirmations" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/appointments/upcoming" -Description "Get upcoming appointments (for confirmations)"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.20 Weather/Closure Alerts
Write-Host "`n[4.20] Weather/Closure Alerts" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/alerts" -Description "Get all alerts"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# 4.21 Promotional Offers
Write-Host "`n[4.21] Promotional Offers" -ForegroundColor Yellow
$results.Total++
$result = Test-ApiEndpoint -Method "GET" -Endpoint "/api/promotional-offers" -Description "Get promotional offers"
if ($result.Success) { $results.Passed++ } else { $results.Failed++ }

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total Tests: $($results.Total)" -ForegroundColor White
Write-Host "Passed: $($results.Passed)" -ForegroundColor Green
Write-Host "Failed: $($results.Failed)" -ForegroundColor Red
$successRate = [math]::Round(($results.Passed / $results.Total) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })

if ($results.Failed -gt 0) {
    Write-Host "`nSome tests failed. Check the errors above." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`nAll tests passed! ✓" -ForegroundColor Green
    exit 0
}

