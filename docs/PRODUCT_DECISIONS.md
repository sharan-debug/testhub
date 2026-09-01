# TestHub V1 — Product Decisions

Accepted decisions that must not be reversed without an explicit product directive.

---

## Authentication

Email/password authentication backed by MongoDB.

## Google OAuth

Out of scope for V1.

## SSO / external identity providers

Out of scope for V1.

## Password storage

Passwords must be securely hashed. Plaintext passwords must never be stored.

## User identity

The authenticated email is the TestHub user identity. It is used for ownership, editor history, audit records, and activity history.

## Registration

V1 includes a self-registration flow (email + password). There is no invitation or admin-approval gate for registration.

## Roles

Viewer / Editor / Approver / Admin. Initial role assignment is admin-controlled.

---

## Feature scope

| Decision | V1 choice |
|---|---|
| Test Scenarios | V2 — not required in V1 |
| Jira | Optional field; API integration V2 |
| Redis | Store key/pattern only |
| Experiments | Name + options/required option |
| APIs | Store cURL text + optional description |
| API execution | Not allowed in V1 |
| Mongo collections | Store collection names only |
| Test Data | Free text |
| Test Steps | Free text |
| Mocking Steps | Free text |
| Relationships | V2 |
| Dependency graph | V2 |
| Conflict detection | V2 |
| Quick Add | V1 |
| Search | V1 |
| AI | Read-only V1 |
| AI writes | V2/V3 |
| QA Utility | V2/V3 |
| Environment mutation | V2/V3 |
| TestHub audit history | V1 |
| Environment execution history | QA Utility later |
| Last Verified | V1 |
| Core Feature | Mandatory dropdown |
| Jira mandatory | No |
| Owner | Auto-populated from authenticated user |
| Import | Current feature CSV/Excel format |
| Import preview/confirm | V1 |
| Test Case import | Separate future import |
