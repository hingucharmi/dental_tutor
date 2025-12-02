# Phase 5 API Testing Guide

This document contains curl commands and test cases for all Phase 5 Enterprise Features APIs.

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

## 5.6 Referral Management (Feature #42)

### Create Referral
```bash
curl -X POST http://localhost:3000/api/referrals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": 1,
    "referringDentistId": 1,
    "specialistName": "Dr. John Smith",
    "specialistType": "orthodontist",
    "reason": "Patient requires orthodontic treatment",
    "urgency": "normal",
    "notes": "Patient has severe misalignment"
  }'
```

### Get All Referrals
```bash
curl -X GET http://localhost:3000/api/referrals \
  -H "Authorization: Bearer $TOKEN"
```

### Get Referrals by Status
```bash
curl -X GET "http://localhost:3000/api/referrals?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Referral
```bash
curl -X GET http://localhost:3000/api/referrals/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update Referral
```bash
curl -X PUT http://localhost:3000/api/referrals/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "sent",
    "notes": "Referral sent to specialist"
  }'
```

### Get Specialist Directory
```bash
curl -X GET http://localhost:3000/api/referrals/specialists \
  -H "Authorization: Bearer $TOKEN"
```

### Get Specialists by Type
```bash
curl -X GET "http://localhost:3000/api/referrals/specialists?type=orthodontist" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5.7 Document Access (Feature #43)

### Upload Document
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": 1,
    "documentType": "xray",
    "fileName": "xray_2024_01_15.jpg",
    "filePath": "/uploads/xray_2024_01_15.jpg",
    "fileSize": 2048000,
    "mimeType": "image/jpeg",
    "description": "X-ray of upper molars"
  }'
```

### Get All Documents
```bash
curl -X GET http://localhost:3000/api/documents \
  -H "Authorization: Bearer $TOKEN"
```

### Get Documents by Type
```bash
curl -X GET "http://localhost:3000/api/documents?type=xray" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Documents by Appointment
```bash
curl -X GET "http://localhost:3000/api/documents?appointmentId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Document
```bash
curl -X GET http://localhost:3000/api/documents/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Download Document
```bash
curl -X GET "http://localhost:3000/api/documents/1?download=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Document
```bash
curl -X DELETE http://localhost:3000/api/documents/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5.9 Smart Recommendations (Feature #45)

### Get All Recommendations
```bash
curl -X GET http://localhost:3000/api/recommendations \
  -H "Authorization: Bearer $TOKEN"
```

### Get Recommendations by Status
```bash
curl -X GET "http://localhost:3000/api/recommendations?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Recommendations by Type
```bash
curl -X GET "http://localhost:3000/api/recommendations?type=preventive_care" \
  -H "Authorization: Bearer $TOKEN"
```

### Accept Recommendation
```bash
curl -X POST http://localhost:3000/api/recommendations/1/accept \
  -H "Authorization: Bearer $TOKEN"
```

### Dismiss Recommendation
```bash
curl -X POST http://localhost:3000/api/recommendations/1/dismiss \
  -H "Authorization: Bearer $TOKEN"
```

---

## Document Types
- `receipt` - Payment receipts
- `xray` - X-ray images
- `treatment_plan` - Treatment plans
- `prescription` - Prescriptions
- `form` - Medical forms
- `other` - Other documents

## Referral Status Values
- `pending` - Referral created but not sent
- `sent` - Referral sent to specialist
- `accepted` - Specialist accepted referral
- `completed` - Treatment completed
- `cancelled` - Referral cancelled

## Recommendation Types
- `appointment_time` - Suggested appointment times
- `service` - Recommended services
- `preventive_care` - Preventive care recommendations
- `treatment` - Treatment recommendations

## Recommendation Status Values
- `pending` - New recommendation
- `accepted` - User accepted recommendation
- `dismissed` - User dismissed recommendation
- `completed` - Recommendation completed

---

## Testing Checklist

- [ ] Create referral
- [ ] Get all referrals
- [ ] Get referral by ID
- [ ] Update referral status
- [ ] Get specialist directory
- [ ] Upload document
- [ ] Get all documents
- [ ] Get document by ID
- [ ] Download document
- [ ] Delete document
- [ ] Get recommendations
- [ ] Accept recommendation
- [ ] Dismiss recommendation

---

---

## 5.5 Payment Processing (Feature #41)

### Process Payment
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": 1,
    "amount": 150.00,
    "currency": "USD",
    "paymentMethod": "stripe",
    "metadata": {
      "description": "Dental cleaning appointment"
    }
  }'
```

### Get Payment Transactions
```bash
curl -X GET http://localhost:3000/api/payments/transactions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Transactions by Status
```bash
curl -X GET "http://localhost:3000/api/payments/transactions?status=completed" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Transactions by Payment Method
```bash
curl -X GET "http://localhost:3000/api/payments/transactions?paymentMethod=stripe" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5.3 Photo Upload (Feature #39)

### Upload Image
```bash
curl -X POST http://localhost:3000/api/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": 1,
    "imageType": "symptom",
    "fileName": "tooth_pain_2024.jpg",
    "filePath": "/uploads/tooth_pain_2024.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "description": "Photo of painful tooth"
  }'
```

### Get All Images
```bash
curl -X GET http://localhost:3000/api/images \
  -H "Authorization: Bearer $TOKEN"
```

### Get Images by Type
```bash
curl -X GET "http://localhost:3000/api/images?type=symptom" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Images by Appointment
```bash
curl -X GET "http://localhost:3000/api/images?appointmentId=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5.13 Loyalty Program (Feature #49)

### Get Loyalty Points
```bash
curl -X GET http://localhost:3000/api/loyalty/points \
  -H "Authorization: Bearer $TOKEN"
```

### Get Loyalty Transactions
```bash
curl -X GET http://localhost:3000/api/loyalty/transactions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Transactions by Type
```bash
curl -X GET "http://localhost:3000/api/loyalty/transactions?type=earned" \
  -H "Authorization: Bearer $TOKEN"
```

**Loyalty Tiers**:
- Bronze: 0-199 points
- Silver: 200-499 points
- Gold: 500-999 points
- Platinum: 1000+ points

**Transaction Types**:
- `earned` - Points earned
- `redeemed` - Points redeemed
- `expired` - Points expired
- `bonus` - Bonus points

---

## Notes

1. **File Upload**: The document/image upload endpoints expect file metadata. Actual file upload should be handled via multipart/form-data in production.
2. **File Storage**: Currently returns file paths. In production, integrate with S3, Cloudinary, or similar service.
3. **Payment Gateway**: Payment processing currently simulates success. Integrate with Stripe/PayPal in production.
4. **Security**: All endpoints require authentication. Users can only access their own data.
5. **Error Handling**: All endpoints return consistent error format with CORS headers.
6. **Image Moderation**: Photo uploads include moderation status. Implement moderation service in production.

