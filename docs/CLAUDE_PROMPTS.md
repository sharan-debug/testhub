# Claude Development Prompts — TestHub V1

Use these prompts one at a time.

## Prompt 0 — Inspect before changing

Read `CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/API_CONTRACT.md`, and `docs/IMPLEMENTATION_PLAN.md`.

Then inspect the existing TestHub repository.

Do not modify files yet.

Report:
1. Current frontend architecture
2. Current backend architecture
3. Current Mongo models
4. Current auth flow
5. Current import flow
6. Current AI flow
7. Existing Docker/deployment configuration
8. Files that can be reused
9. Files that need modification for V1
10. Any architectural conflicts

Create `docs/CURRENT_STATE.md`.

---

## Prompt 1 — Authentication

Implement Google Workspace OAuth login according to the V1 PRD.

Before coding:
- inspect existing auth code
- preserve working routes where possible
- identify the current auth callback structure

Requirements:
- no registration
- no local password login
- secure backend OAuth callback
- secure application session
- `/auth/me`
- logout
- user auto-provisioning
- role loaded from MongoDB
- backend authorization
- no Google credentials in frontend

Do not request unnecessary Google Workspace API scopes.

Add tests and explain the required Google Cloud Console configuration.

---

## Prompt 2 — RBAC

Implement:
viewer
editor
approver
admin

Enforce roles in the backend.

Do not rely on frontend hiding.

Add authorization tests.

---

## Prompt 3 — Core Feature

Implement the Core Feature collection and mandatory dropdown.

Do not add scenarios or relationships.

---

## Prompt 4 — Feature model

Update the Feature model with:
- coreFeatureId
- optional jiraTicket
- ownerId
- createdBy
- updatedBy
- timestamps
- lastVerifiedAt
- lastVerifiedBy
- status

Preserve all existing fields.

---

## Prompt 5 — Low-friction form

Refactor the Feature form to minimize user effort.

Required:
- Core Feature
- Feature Name

Automatic:
- Owner

Optional:
- Jira
- Description
- Tags
- Test Data
- Test Steps
- Mocking Steps
- APIs
- Mongo Collections
- Redis Keys
- Experiments

Do not introduce scenarios.

---

## Prompt 6 — cURL API

Change API storage to:
- raw cURL
- optional description

Render cURL safely.

Do not execute it.

Implement secret redaction in logs/audit.

---

## Prompt 7 — Quick Add

Implement Quick Add:
- Core Feature
- Feature Name
- free text notes
- save

---

## Prompt 8 — Import

Preserve the current feature import.

Add:
- validation
- preview
- duplicate detection
- confirm
- import audit event

Do not implement Test Case import yet.

---

## Prompt 9 — Search

Implement MongoDB-backed search across all relevant V1 feature fields.

Return matched fields.

---

## Prompt 10 — Audit

Implement TestHub knowledge history.

Record:
- create
- update
- delete
- import
- verify

Never store secrets in audit logs.

---

## Prompt 11 — AI

Implement read-only `/ai/chat`.

Flow:
question -> retrieve -> bounded context -> approved AI endpoint -> answer + sources.

Do not give the AI mutation tools.

Do not send the whole database.

---

## Prompt 12 — Production hardening

Perform a security and production readiness review against:
`.claude/skills/security-review/SKILL.md`

Fix only issues relevant to V1.

Run:
- tests
- frontend build
- backend checks
- dependency audit
- secret scan
- Docker build

Report remaining risks.
