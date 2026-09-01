# CLAUDE.md — TestHub

## Mission

Build TestHub V1 as a low-friction, production-ready internal QA knowledge hub.

The product exists to solve one core problem:

> A QA should be able to find the test data, mocks, APIs, Redis keys, experiments/flags and feature knowledge required for testing without depending on another person or searching scattered documents.

## Product principle

**Minimum contribution effort → maximum discoverability.**

Do NOT turn V1 into a test-case management system or require users to document detailed scenarios.

A user must be able to create useful knowledge in roughly the same effort as maintaining the existing Excel sheet.

## Existing stack

- Frontend: React / Node
- Backend: Python
- Database: MongoDB
- Containerized with Docker
- Frontend production image: Node build stage + Nginx
- Internal/staging-focused application
- Target deployment: AWS, accessed through company network/VPN
- AI: company-approved internal Claude/Anthropic endpoint; model key must remain server-side

## Current V1 scope

### Authentication
- Google Workspace login only
- No username/password registration
- No registration form
- Automatically create/update the user's basic TestHub account after successful company authentication
- Restrict access to the approved company identity/domain
- Do not assume the Marketplace URL itself proves that the company uses Google Workspace; deployment configuration must be verified with the company's Google Workspace/Cloud administrator.

### Roles
- Viewer
- Editor
- Approver
- Admin

Initial role assignment is controlled by TestHub Admin.

### Feature knowledge
A TestHub Feature contains:
- Core Feature
- Feature name
- Optional Jira ticket
- Description
- Tags
- Test Data
- Test Steps
- Mocking Steps
- Automation APIs as cURL + optional description
- MongoDB collection names
- Redis key names
- Experiments / Flags with simple required option information
- Owner
- Created/updated metadata
- Last verified metadata

### Important V1 simplifications
DO NOT require:
- Test Scenarios
- Dependency graphs
- Asset relationships
- Redis value/TTL/state modeling
- Automatic experiment conflict detection
- Jira integration
- QA Utility execution
- Redis/Unleash/mock execution
- Structured test-case import
- Complex API parsing

These are V2/V3 candidates.

### Jira
The Jira ticket field may exist in V1 but is OPTIONAL.
Jira API integration is a planned future feature and should be designed so it can be added without a schema rewrite.

### Redis
Store only the Redis key/pattern in V1.
Example:
`r:jar:cancellation:{user_id}`

Do not ask users to enter:
- current value
- TTL
- data type
- purpose
- lifecycle

Those details remain in existing Redis tooling or optional free-text Test Data/Mocking Steps.

### Experiments
Store:
- experiment/flag name
- available options if known
- required option

Examples:
- CONTROL / TEST
- VARIANT_A / VARIANT_B

Do not require a detailed explanation unless the user chooses to provide it.

### APIs
APIs are primarily for the automation team.
Store the API as a cURL string plus an optional human-readable description.
Preserve the cURL as text.
Do not require users to manually split method, URL, headers and body in V1.

### Import
Keep the current Feature import.
The current source sheet contains these fields:
- `name`
- `description`
- `owner`
- `tags`
- `test_data`
- `test_steps`
- `mocking_steps`
- `api`
- `mongo_collections`
- `redis_keys`
- `experiments`

A separate Test Case import option is planned, but the input format is intentionally not fixed yet because team members may maintain test-case sheets differently.

### Quick Add
Provide a low-friction Quick Add flow where a user can select a Core Feature, enter a Feature Name, paste notes/data, and save without filling every section.

### History
TestHub history means history of changes to knowledge stored in TestHub.
It does NOT mean environment execution history.

Every create/update/delete that changes TestHub knowledge should create an audit event.

### AI
AI is read-only in V1.
It can:
- search/retrieve TestHub data
- answer questions
- summarize feature knowledge
- explain stored Redis/experiment/mock/API information
- cite/show the TestHub source context used

AI cannot:
- edit TestHub
- modify MongoDB directly
- modify Redis
- modify Unleash
- execute mocks
- execute arbitrary APIs
- prepare staging state

AI calls must go through the Python backend. Never expose the model/API key to the browser.

## V2 direction

V2 is expected to add:
- Test Scenarios
- Relationships between features and assets
- Dependency discovery
- Conflict detection
- Jira API integration
- Flexible test-case import
- AI-assisted enrichment
- QA Utility integration
- Redis/Unleash/mock execution
- Environment-state verification

## V3 direction

V3 may provide:
- "Prepare test state"
- AI-assisted environment setup
- QA Utility orchestration
- State verification
- User confirmation before mutations

## Coding rules

1. Inspect the existing implementation before changing it.
2. Prefer incremental changes over rewrites.
3. Preserve existing working functionality unless the task explicitly changes it.
4. Keep business logic in the backend, not React.
5. Keep secrets server-side.
6. Validate authorization on the backend for every protected mutation.
7. Never trust a role supplied by the frontend.
8. Never execute user-provided cURL in V1.
9. Treat imported data as untrusted input.
10. Add audit logging to mutations.
11. Use UTC timestamps in storage.
12. Return clear API errors with stable error codes.
13. Add tests for new backend behavior.
14. Keep UI changes consistent with the existing TestHub design.
15. Do not add V2 complexity to V1 unless it directly reduces V1 user effort.

## Development workflow for Claude

Before coding:
1. Read this file.
2. Read `docs/PRD.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Read `docs/DATA_MODEL.md`.
5. Read `docs/API_CONTRACT.md`.
6. Read `docs/IMPLEMENTATION_PLAN.md`.
7. Read `.claude/skills/testhub-v1/SKILL.md`.
8. Inspect the actual repository files.
9. State what existing files will be changed and why.
10. Implement the smallest coherent change.
11. Run relevant tests/lint/build.
12. Report files changed, validation performed, and remaining risks.

When a requirement is ambiguous:
- Prefer the current V1 rules in this file.
- Do not invent V2 requirements.
- Ask only when the ambiguity can cause data loss, security issues, or an architectural dead end.

## Critical Product Decisions

Before modifying authentication, read:

- `docs/PRODUCT_DECISIONS.md`
- `docs/AUTHENTICATION.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/API_CONTRACT.md`

### Authentication

Do NOT implement Google OAuth or Google Workspace authentication.

TestHub V1 uses application-managed username/password
authentication backed by MongoDB.

Do not change this architecture unless explicitly instructed
by the user.

### Documentation hierarchy

Use the following responsibilities:

- `PRD.md` — product requirements
- `PRODUCT_DECISIONS.md` — accepted product decisions and
  decisions that must not be reversed
- `AUTHENTICATION.md` — authentication-specific requirements
- `ARCHITECTURE.md` — technical architecture
- `DATA_MODEL.md` — persistence model
- `API_CONTRACT.md` — backend API contract
- `IMPLEMENTATION_PLAN.md` — implementation sequence
- `CLAUDE.md` — instructions for working on the repository

Do not duplicate large sections between these documents.
Prefer referencing the authoritative document.