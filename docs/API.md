# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Include JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication Module (`/api/auth`)

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

### Crop Module (`/api/crops`)

#### Get All Crops
```
GET /api/crops
Response: [{ id, name, type, quantity, harvestDate, ... }]
```

#### Create Crop
```
POST /api/crops
Content-Type: application/json

{
  "name": "Rice",
  "type": "cereal",
  "quantity": 100,
  "unit": "kg"
}
```

### Plantation Module (`/api/plantations`)

#### Get All Plantations
```
GET /api/plantations
Response: [{ id, name, location, area, ... }]
```

#### Get Plantation by ID
```
GET /api/plantations/:id
```

### Harvest Module (`/api/harvests`)

#### Record Harvest
```
POST /api/harvests
Content-Type: application/json

{
  "cropId": "crop_id",
  "quantity": 150,
  "harvestDate": "2024-06-23",
  "quality": "Grade A"
}
```

### Trace Module (`/api/traces`)

#### Get Trace Information
```
GET /api/traces/:productId
Response: {
  "productId": "...",
  "origin": "...",
  "journey": [...],
  "currentLocation": "...",
  "verified": true
}
```

#### Get Full Traceability Chain
```
GET /api/traces/:productId/chain
Response: {
  "product": {...},
  "crop": {...},
  "harvest": {...},
  "packing": {...},
  "shipping": {...}
}
```

### Verification Module (`/api/verification`)

#### Verify Product
```
POST /api/verification/verify
Content-Type: application/json

{
  "productId": "...",
  "verificationCode": "..."
}

Response: {
  "isVerified": true,
  "details": {...}
}
```

### Media Module (`/api/media`)

#### Upload Media
```
POST /api/media/upload
Content-Type: multipart/form-data

FormData:
- file: <file>
- productId: "..."
- type: "image" | "video"
```

#### Get Media for Product
```
GET /api/media/product/:productId
Response: [{ id, url, type, uploadDate, ... }]
```

### Video Generator Service

#### Render Video from URLs
```
POST http://localhost:8000/render-from-urls
Content-Type: application/json

{
  "images": ["url1", "url2", "url3"],
  "title": "Product Journey",
  "music": true
}

Response:
{
  "job_id": "job_123",
  "status": "processing"
}
```

#### Check Job Status
```
GET http://localhost:8000/status/job_123
Response: {
  "job_id": "job_123",
  "status": "completed",
  "progress": 100,
  "result_url": "..."
}
```

#### Download Video
```
GET http://localhost:8000/download/job_123
Response: <binary video file>
```

## Error Responses

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Wrong email/password
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `INTERNAL_ERROR` - Server error

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
