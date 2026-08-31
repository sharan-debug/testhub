# TestHub V1 — API Contract

Base path:
`/api`

## Authentication

### GET /auth/google/start

Starts Google OAuth.

Response:
Redirect to Google.

### GET /auth/google/callback

Handles OAuth callback.

On success:
- create/update user
- establish secure application session
- redirect to frontend

### GET /auth/me

Response:

```json
{
  "id": "...",
  "email": "user@company.in",
  "name": "Sharan Shetty",
  "role": "editor",
  "status": "active"
}
```

### POST /auth/logout

Clears the application session.

---

## Core Features

### GET /core-features

Returns active Core Features.

### POST /core-features

Admin/editor operation as configured.

Request:

```json
{
  "name": "Precancellation",
  "description": ""
}
```

### PUT /core-features/{id}

Updates a Core Feature.

---

## Features

### GET /features

Optional query parameters:

```text
?q=
&coreFeatureId=
&tag=
&page=
&pageSize=
```

### POST /features

Minimum request:

```json
{
  "coreFeatureId": "...",
  "name": "Precancellation cancellation eligibility"
}
```

Optional fields may be included.

### GET /features/{id}

Returns the complete feature.

### PUT /features/{id}

Partial update is preferred.

Example:

```json
{
  "description": "...",
  "redisKeys": [
    "r:jar:cancellation:{user_id}"
  ]
}
```

### DELETE /features/{id}

Soft delete preferred.

---

## Search

### GET /search

Example:

`GET /api/search?q=precancellation`

Response:

```json
{
  "query": "precancellation",
  "results": [
    {
      "type": "feature",
      "id": "...",
      "name": "Precancellation cancellation eligibility",
      "matchedFields": [
        "name",
        "redisKeys"
      ]
    }
  ]
}
```

---

## History

### GET /features/{id}/history

Returns TestHub knowledge changes.

Do not return secrets.

---

## Verification

### POST /features/{id}/verify

Updates:

```text
lastVerifiedAt
lastVerifiedBy
```

and creates an audit event.

---

## Imports

### POST /imports/features

Upload CSV/XLSX.

Backend validates and creates an import preview.

### GET /imports/{id}

Returns preview/status.

### POST /imports/{id}/confirm

Persists the import.

---

## AI

### POST /ai/chat

Request:

```json
{
  "message": "What do I need to test Precancellation?"
}
```

Response:

```json
{
  "answer": "....",
  "sources": [
    {
      "type": "feature",
      "id": "...",
      "name": "Precancellation cancellation eligibility",
      "sections": [
        "testData",
        "redisKeys",
        "experiments",
        "mockingSteps"
      ]
    }
  ]
}
```

AI must not have mutation tools in V1.

---

## Error format

Use a stable format:

```json
{
  "error": {
    "code": "FEATURE_NOT_FOUND",
    "message": "Feature not found",
    "requestId": "..."
  }
}
```

Suggested codes:
- AUTH_REQUIRED
- FORBIDDEN
- INVALID_INPUT
- FEATURE_NOT_FOUND
- CORE_FEATURE_NOT_FOUND
- IMPORT_INVALID
- IMPORT_PARSE_ERROR
- DUPLICATE_FEATURE
- AI_UNAVAILABLE
- INTERNAL_ERROR

## Authentication APIs

### POST /api/auth/register

Creates a new TestHub user.

Request:

{
  "username": "user",
  "password": "password"
}

Response:

{
  "message": "Registration successful"
}

---

### POST /api/auth/login

Authenticates an existing user.

Request:

{
  "username": "user",
  "password": "password"
}

Response:

{
  "user": {
    "username": "user",
    "role": "viewer"
  }
}

---

### POST /api/auth/logout

Terminates the authenticated session.

---

### GET /api/auth/me

Returns the currently authenticated user.

Response:

{
  "username": "user",
  "role": "viewer"
}