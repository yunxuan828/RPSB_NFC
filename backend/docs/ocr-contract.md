# OCR Microservice Contract

## Overview
This service accepts images of business cards (namecards) and returns extracted text and structured contact information.

## Endpoint
`POST /ocr/namecard`

### Request
- **Method:** POST
- **Content-Type:** `multipart/form-data`
- **Body:**
    - `front_image`: (File, Required) The image of the front of the card.
    - `back_image`: (File, Optional) The image of the back of the card.

### Response

**Success (200 OK)**

```json
{
  "raw_text_front": "John Doe\nAcme Corp\n...",
  "raw_text_back": "...",
  "extracted_fields": {
    "full_name": "John Doe",
    "customer_company_name": "Acme Corp",
    "job_title": "CEO",
    "email": "john@acme.com",
    "phone": "+1 555 0101",
    "website": "www.acme.com",
    "address": "123 Industrial Way..."
  },
  "confidence": {
    "full_name": 0.95,
    "email": 0.99
    // ...
  },
  "meta": {
    "model_version": "1.0",
    "processing_time_ms": 120
  }
}
```

**Error (4xx/5xx)**

```json
{
  "error": "Invalid image format"
}
```

## Configuration
The Laravel backend connects to this service using the `OCR_URL` environment variable.
Example: `OCR_URL=http://localhost:5000/ocr/namecard`
