# TestHub V1 — Implementation Plan for Claude

## Working rule

Implement in small, verifiable increments.

Do not ask Claude to rebuild the entire application in one prompt.

Each phase should:
1. inspect current code
2. make a focused change
3. run tests/build
4. report changes
5. stop

## Phase completion rule

After every phase:
1. Run all backend tests (`pytest`)
2. Build the frontend (`npm run build`)
3. Verify the backend starts cleanly
4. Commit all changes with a descriptive message
5. Push to git

---

# Phase 0 — Baseline

### Goal
Understand the current application before modification.

Claude tasks:
- inspect frontend tree
- inspect backend tree
- inspect Mongo connection
- inspect current auth
- inspect feature schema/model
- inspect import implementation
- inspect AI implementation
- inspect Docker configuration
- inspect `.env` handling
- identify current API endpoints
- identify current tests

Deliver:
`docs/CURRENT_STATE.md`

Do not make product changes.

---

# Phase 1 — Production configuration foundation

### Goal
Separate local/dev/prod configuration.

Implement:
- environment configuration
- backend config validation
- frontend backend URL configuration
- secure secret loading
- structured logging
- request IDs
- consistent error responses

Do not change auth yet.

Validation:
- frontend build
- backend startup
- existing functionality smoke test

---

# Phase 2 — (Auth already implemented — skip)

Email/password registration and login are implemented in the current codebase (Phase 0 baseline). Authentication was verified during Phase 0 analysis. The working rule is to preserve existing auth and build RBAC on top of it in Phase 3.

---

# Phase 3 — RBAC

Implement backend authorization first.

Roles:
- viewer
- editor
- approver
- admin

Tests:
- viewer cannot mutate
- editor can create/update
- approver permissions
- admin role management
- frontend hiding must never be the only authorization control

---

# Phase 4 — Core Feature

Implement:
- `core_features` collection
- admin/editor management
- mandatory Core Feature dropdown in Feature form
- existing feature migration/mapping where possible

Do not introduce scenarios.

---

# Phase 5 — Feature V1 model

Preserve current feature fields.

Add:
- optional Jira ticket
- automatic owner
- createdBy
- updatedBy
- timestamps
- status
- lastVerifiedAt
- lastVerifiedBy

Do not require Jira.

Do not require scenarios.

---

# Phase 6 — Low-friction form UX

Improve Feature form:

1. Core Feature — required
2. Feature Name — required
3. Jira — optional
4. Owner — automatic
5. Description
6. Tags
7. Test Data
8. Test Steps
9. Mocking Steps
10. Automation APIs
11. MongoDB Collections
12. Redis Keys
13. Experiments / Flags

For free-text fields:
- use helpful placeholder examples
- do not validate a documentation template
- allow Markdown/plain text

---

# Phase 7 — API/cURL

Change API entry to:

- cURL text
- optional description

Store raw cURL.

Render it in a code block.

Do not execute it.

Do not log secrets contained in cURL.

Implement secret redaction for audit logs if cURL is changed.

---

# Phase 8 — Quick Add

Implement:

- Core Feature
- Feature Name
- free-text notes
- Save

Do not force the full form.

---

# Phase 9 — Import

Preserve existing Feature CSV import.

Add:
- upload
- parse
- mapping
- validation
- preview
- duplicate handling
- confirm
- audit event

Use the current feature import columns as the compatibility contract.

Do NOT finalize the Test Case spreadsheet schema yet.

---

# Phase 10 — Search

Implement MongoDB-backed search.

Search:
- name
- core feature
- Jira
- description
- tags
- test data
- test steps
- mocking steps
- API description/cURL
- Mongo collections
- Redis keys
- experiments

Add indexes based on actual query patterns.

---

# Phase 11 — TestHub history

Implement audit logging for:
- create
- update
- delete
- import
- verify
- role changes

Build Feature History UI.

History is TestHub knowledge history only.

---

# Phase 12 — Last Verified

Add:
- Mark as Verified
- timestamp
- verified by
- audit event

---

# Phase 13 — AI V1

Implement:
- `/ai/chat`
- retrieval from TestHub
- bounded context
- read-only model call
- source references
- "I don't know" behavior when data is absent

AI prompt must distinguish:
- stored facts
- inference
- missing information

No mutation tools.

---

# Phase 14 — Production hardening

Before deployment:
- secret scan
- dependency audit
- CORS restriction
- cookie/session security
- CSRF protection appropriate to chosen auth/session architecture
- rate limiting
- request size limits
- upload limits
- MongoDB authentication
- database network restriction
- structured logs
- health endpoint
- readiness endpoint
- error handling
- backup/restore plan
- container vulnerability scan
- non-root containers where practical
- no secrets in Docker image
- no secrets in Git
- no AI key in frontend

---

# Phase 15 — Production smoke test

Test:
1. Login (email/password)
2. Viewer access
3. Editor create
4. Editor edit
5. History
6. Search
7. AI question
8. Import
9. Quick Add
10. Logout
11. unauthorized access
12. expired session
13. malformed import
14. malformed feature payload
15. large input
16. cURL secret redaction

---

# V2 backlog

- Jira API integration
- Test Cases import
- Test Scenarios
- Asset relationships
- Dependency graph
- AI-assisted enrichment
- QA Utility integration
- Redis execution
- Unleash execution
- Mock execution
- execution audit
- conflict detection

# V3 backlog

- Prepare Test State
- AI planning
- user confirmation
- QA Utility orchestration
- environment verification

