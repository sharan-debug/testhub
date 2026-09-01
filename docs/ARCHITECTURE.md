# TestHub V1 — Architecture

## 1. Architecture principles

- Keep V1 small.
- Preserve the existing React/Python/Mongo stack.
- Avoid unnecessary new infrastructure.
- Keep secrets and business rules server-side.
- Separate knowledge storage from future environment execution.
- Design V1 APIs so V2 integrations can be added without rewriting the domain model.

## 2. Logical architecture

```text
Browser (internal network / VPN)
       |
       v
+-------------------------------+
|          TestHub              |
|                               |
| React Frontend                |
|       |                       |
|       v                       |
| Python Backend                |
|   |       |       |           |
| Auth   Feature   AI           |
|        Service   Service      |
+---|-------|-------|-----------+
    |       |       |
    v       v       v
  Users  Features  Retrieval
    |       |       |
    +-------+-------+
            |
            v
         MongoDB
            |
            v
       Audit Logs

AI Service
    |
    v
Approved internal AI endpoint

Future:
TestHub -> QA Utility -> Redis / Unleash / Mock
```

## 3. Frontend

Keep React.

Recommended logical areas:

```text
src/
  components/
    Activity/
    Feature/
    Import/
    Search/
    AI/
    Layout/

  contexts/
    AuthContext

  lib/
    api.js

  pages/
    Login/
    Dashboard/
    Features/
    FeatureDetails/
    FeatureEdit/
    Import/
```

Do not rewrite the frontend solely to match this tree. Adapt the existing structure incrementally.

## 4. Backend

Recommended logical modules:

```text
backend/
  api/
    auth.py
    features.py
    core_features.py
    imports.py
    search.py
    ai.py
    audit.py

  services/
    auth_service.py
    feature_service.py
    import_service.py
    search_service.py
    ai_service.py
    audit_service.py

  repositories/
    user_repository.py
    feature_repository.py
    audit_repository.py

  models/
    user.py
    feature.py
    audit.py

  middleware/
    authentication.py
    authorization.py

  config.py
  server.py
```

Use this as a target organization, not a reason to rewrite working code. Incremental extraction from the current `server.py` is acceptable.

## 5. Database

V1 collections:

```text
users
core_features
features
audit_logs
imports
user_sessions
chat_messages
```

Redis, Experiments, and APIs remain embedded inside the feature document. Do not create separate collections for them in V1.

## 6. Authentication architecture

```text
Browser
    ↓
Backend Authentication API
    ↓
MongoDB Users Collection
```

Email/password authentication. Backend owns session creation and validation. Frontend must not bypass the backend for authentication decisions.

Backend is responsible for:

- registration (email + password)
- password hashing
- password verification
- session creation and storage
- authentication middleware
- authorization checks

Session token delivered as HTTP-only cookie. Cookie must be `secure=True` in staging/production (HTTPS). `secure=False` is acceptable for local development over HTTP.

No Google OAuth. No external identity providers. No SSO.

## 7. Authorization

Backend determines role.

Frontend may hide UI elements for unauthorized actions, but backend is the authority.

Every mutation must check:
- authenticated user
- role
- entity permissions where applicable

Never trust a role supplied by the frontend.

## 8. Feature document

Conceptual shape:

```json
{
  "_id": "ObjectId",
  "id": "feat_<hex>",
  "name": "Precancellation cancellation eligibility",
  "coreFeatureId": "ObjectId",
  "jiraTicket": "ABC-123",
  "description": "...",
  "ownerId": "email string",
  "tags": ["precancellation"],
  "testData": "...",
  "testSteps": "...",
  "mockingSteps": "...",
  "apis": [
    {
      "id": "uuid",
      "curl": "curl --location 'https://...'",
      "description": "Optional description"
    }
  ],
  "mongoCollections": ["users"],
  "redisKeys": [
    "r:jar:cancellation:{user_id}"
  ],
  "experiments": [
    {
      "id": "uuid",
      "name": "precancellation-exp",
      "options": ["CONTROL", "TEST"],
      "required": "TEST"
    }
  ],
  "createdBy": "email string",
  "updatedBy": "email string",
  "createdAt": "UTC datetime",
  "updatedAt": "UTC datetime",
  "lastVerifiedAt": "UTC datetime",
  "lastVerifiedBy": "email string",
  "status": "active"
}
```

## 9. API representation

Store cURL as raw text.

Do not normalize cURL into separate method/URL/header/body fields in V1.

Frontend renders it as preformatted code.

AI receives field context:

```text
Feature: Precancellation
Section: Automation API
Description: Fetch cancellation eligibility
cURL:
<raw cURL>
```

## 10. Search

Start with MongoDB-native text search / regex.

Do not introduce a vector database in V1.

Potential later evolution:
- full-text index improvements
- embeddings
- vector search
- semantic retrieval

## 11. AI retrieval

```text
User question
    |
    v
POST /api/chat
    |
    v
Authenticate
    |
    v
Fetch relevant TestHub features from MongoDB
    |
    v
Build bounded context (text block from feature fields)
    |
    v
Approved internal AI endpoint
    |
    v
Validate response
    |
    v
Return answer + source references
```

The current implementation loads up to 200 features as context. This approach is acceptable for V1 at the expected user volume. Context size and retrieval quality will be revisited after real usage. Do not replace this with a vector/RAG system unless the current approach proves insufficient.

Never send the entire database raw to the model; build a structured text representation.

## 12. AI safety

V1 agent is read-only.

Do not provide tools capable of:
- MongoDB mutations
- Redis mutations
- Unleash mutations
- arbitrary HTTP execution
- shell execution

## 13. Audit

Mutation flow:

```text
Request
  |
  v
Authenticate
  |
  v
Authorize
  |
  v
Validate
  |
  v
Update MongoDB
  |
  v
Write audit event
```

Prefer an implementation that avoids leaving the database updated without a corresponding audit event.

Do not store sensitive credentials (API keys, cURL secrets) in audit log before/after values. Redact where necessary.

## 14. Import

```text
Upload
  |
  v
Validate file type / size
  |
  v
Parse
  |
  v
Map columns
  |
  v
Validate rows
  |
  v
Preview (return to user for confirmation)
  |
  v
Confirm
  |
  v
Persist
  |
  v
Audit import event
```

## 15. Deployment

Target environment: organization's internal AWS/Kubernetes staging infrastructure.

The application is not publicly accessible. Network-level access controls (VPN, internal routing) are an additional layer, but application-level authentication is always enforced.

```text
Internal network / VPN
    |
    v
AWS / Kubernetes staging
    |
    +---- Frontend container (nginx + React build)
    |
    +---- Backend container (FastAPI)
              |
              +---- MongoDB (authenticated, internal only)
              |
              +---- Internal AI endpoint
```

Key deployment requirements:

- MongoDB must use authenticated access in staging (credentials via Kubernetes Secrets or org secret management, never hardcoded)
- Session cookie: `secure=True`, `httponly=True`, `samesite=lax`
- CORS restricted to expected frontend origin(s)
- No secrets in Docker images or Git
- Health check endpoint for container orchestration
- Non-root containers where practical
- Structured logging (no passwords, no API keys in logs)
- Error responses must not expose stack traces

Local development uses `docker-compose` with simpler configuration (no auth on MongoDB, `secure=False` cookie). Production/staging configuration must not inherit these local defaults.

## 16. Future integration boundary

```text
TestHub
   |
   v
QA Utility Adapter
   |
   v
QA Utility
   +-- Redis
   +-- Unleash
   +-- Mocking
```

TestHub must not embed Redis/Unleash execution logic in V1. Execution belongs to the future QA Utility integration.
