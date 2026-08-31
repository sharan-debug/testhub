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
Google Workspace
       |
       v
Google OAuth
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
    ApiInput/
    Feature/
    Import/
    Search/
    AI/
    Layout/

  contexts/
    AuthContext

  lib/
    api.js
    auth.js

  pages/
    Login/
    Dashboard/
    Features/
    FeatureDetails/
    FeatureEdit/
    Import/
    AskAgent/
```

Do not rewrite the frontend solely to match this tree. Adapt the existing structure incrementally.

## 4. Backend

Recommended logical modules:

```text
backend/
  api/
    auth.py
    users.py
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

  utils/
    validation.py
    parsing.py
    logging.py

  config.py
  server.py
```

Again, use this as a target organization, not a reason to rewrite working code.

## 5. Database

V1 collections:

```text
users
core_features
features
audit_logs
imports
```

Do not create dedicated collections for Redis/Experiments/APIs in V1 unless there is a concrete reason.

They can remain embedded inside the feature document.

## 6. Authentication

Use Google OAuth 2.0 / OpenID Connect appropriate for a web application.

Backend owns the callback/token exchange.

Use secure server-side sessions or secure HTTP-only cookies.

Do not put Google access/refresh tokens in localStorage.

For production, confirm:
- company Google Workspace domain
- OAuth consent screen configuration
- Google Cloud project ownership
- internal application configuration
- authorized redirect URI
- authorized JavaScript origin if required
- admin restrictions/allowlisting

The Marketplace URL supplied by the product owner demonstrates access to the Google Workspace Marketplace, but it does not by itself establish that the company account/domain is Google Workspace-managed. Treat the actual Workspace/Cloud configuration as a deployment prerequisite.

## 7. Authorization

Backend determines role.

Frontend may hide UI, but backend is authoritative.

Every mutation must check:
- authenticated user
- account status
- role
- entity permissions

## 8. Feature document

Conceptual shape:

```json
{
  "_id": "ObjectId",
  "name": "Precancellation cancellation eligibility",
  "coreFeatureId": "ObjectId",
  "jiraTicket": "ABC-123",
  "description": "...",
  "ownerId": "ObjectId",
  "tags": ["precancellation"],
  "testData": "...",
  "testSteps": "...",
  "mockingSteps": "...",
  "apis": [
    {
      "curl": "...",
      "description": "..."
    }
  ],
  "mongoCollections": ["users"],
  "redisKeys": [
    "r:jar:cancellation:{user_id}"
  ],
  "experiments": [
    {
      "name": "precancellation-exp",
      "options": ["CONTROL", "TEST"],
      "required": "TEST"
    }
  ],
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId",
  "createdAt": "UTC datetime",
  "updatedAt": "UTC datetime",
  "lastVerifiedAt": "UTC datetime",
  "lastVerifiedBy": "ObjectId",
  "status": "active"
}
```

## 9. API representation

Store cURL as text.

Do not normalize the cURL into separate fields in V1.

Frontend renders it as code/preformatted text.

AI receives field context:

```text
Feature: Precancellation
Section: Automation API
Description: Fetch cancellation eligibility
cURL:
<raw cURL>
```

## 10. Search

Start with MongoDB-native search/indexing.

Do not introduce a vector database in V1.

Potential later evolution:
- full-text search improvements
- embeddings
- vector search
- semantic retrieval

## 11. AI retrieval

```text
User question
    |
    v
POST /ai/chat
    |
    v
Authenticate
    |
    v
Search relevant TestHub records
    |
    v
Build bounded context
    |
    v
Approved AI endpoint
    |
    v
Validate response
    |
    v
Return answer + source references
```

Never send the entire database to the model.

## 12. AI safety

V1 agent is read-only.

Do not provide tools capable of:
- Mongo mutations
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
Update Mongo
  |
  v
Write audit event
```

For important mutations, prefer an implementation that avoids leaving the database updated without a corresponding audit event.

## 14. Import

```text
Upload
  |
  v
Validate file type/size
  |
  v
Parse
  |
  v
Map columns
  |
  v
Normalize
  |
  v
Validate
  |
  v
Preview
  |
  v
Confirm
  |
  v
Persist
  |
  v
Audit import
```

## 15. Deployment

Target:

```text
Office/VPN
    |
    v
AWS internal entry point
    |
    +---- Frontend container
    |
    +---- Backend container
              |
              +---- MongoDB
              |
              +---- Internal AI endpoint
```

Exact AWS service selection is a DevOps decision.

Do not require Kubernetes for V1.

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

TestHub should not directly embed Redis/Unleash execution logic in V1.

## Authentication Architecture

Frontend
    ↓
Backend Authentication API
    ↓
MongoDB Users Collection

The frontend must not directly access MongoDB.

Authentication is handled entirely by the backend.

The backend is responsible for:

- registration
- password hashing
- password verification
- authenticated session/token handling
- authentication middleware
- authorization checks