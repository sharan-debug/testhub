# TestHub — V1 Scope Matrix

Authoritative reference for what must be built now versus what belongs to later phases.

---

## Authentication and access

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Email/password registration | ✓ | | Self-service |
| Email/password login | ✓ | | |
| Secure session (HTTP-only cookie) | ✓ | | |
| Logout | ✓ | | |
| Google OAuth | ✗ | — | Explicitly out of scope |
| SSO / external identity | ✗ | — | Explicitly out of scope |
| MFA | ✗ | — | Out of scope |
| Email verification | ✗ | — | Out of scope |
| Password reset | ✗ | — | Out of scope |
| Invitation-based registration | ✗ | — | Out of scope |

## Authorization

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Viewer role | ✓ | | |
| Editor role | ✓ | | |
| Approver role | ✓ | | |
| Admin role | ✓ | | |
| Backend role enforcement | ✓ | | |
| Admin user management UI | ✓ (basic) | | Role assignment by admin |
| Complex RBAC / entity-level permissions | ✗ | ✓ | |

## Feature knowledge

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Feature name | ✓ | | Required |
| Core Feature (mandatory dropdown) | ✓ | | Required |
| Description | ✓ | | Optional, free text |
| Owner (auto from auth user) | ✓ | | Auto-populated |
| Tags | ✓ | | |
| Jira ticket field | ✓ | | Optional, free text |
| Jira API integration | ✗ | ✓ | |
| Test Data (free text) | ✓ | | |
| Test Steps (free text) | ✓ | | |
| Mocking Steps (free text) | ✓ | | |
| Notes (free text catch-all) | ✓ | | Separate field from description |
| APIs as cURL + description | ✓ | | |
| File attachments (API collection files) | ✓ | | Postman/cURL JSON; stored in GridFS |
| API execution | ✗ | — | Never executes cURL |
| MongoDB collections (names, free text) | ✓ | | |
| MongoDB collections as managed dropdown | ✗ | — | Out of scope entirely |
| Redis keys / patterns | ✓ | | Key/pattern only |
| Redis value / TTL / state | ✗ | — | Out of scope |
| Experiments (name + options + required) | ✓ | | |
| Experiment dependency graph | ✗ | ✓ | |
| Conflict detection | ✗ | ✓ | |
| Test Scenarios | ✗ | ✓ | |
| Asset relationships | ✗ | ✓ | |
| Dependency graph | ✗ | ✓ | |

## Feature lifecycle

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Create | ✓ | | |
| Edit | ✓ | | |
| Soft delete | ✓ | | |
| Last Verified / Mark as Verified | ✓ | | |
| Feature history (TestHub edits) | ✓ | | |
| Environment execution history | ✗ | ✓ | QA Utility |

## Quick Add

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Quick Add (Core Feature + name + notes) | ✓ | | Minimal friction |

## Import

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Feature CSV/Excel import | ✓ | | Current column format |
| Import preview / confirm | ✓ | | |
| Duplicate detection | ✓ | | |
| Import audit event | ✓ | | |
| Test Case import | ✗ | ✓ | Schema not yet fixed |

## Search

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Owner filter in feature list UI | ✓ | | API filter already exists; needs UI |
| Search across all feature fields | ✓ | | |
| matchedFields in response | ✓ | | |
| Vector/semantic search | ✗ | ✓ | |

## AI

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Read-only AI chat | ✓ | | |
| Retrieval from TestHub knowledge | ✓ | | Current full-context approach |
| Source references in answers | ✓ | | |
| AI writes to TestHub | ✗ | ✓ | |
| AI executes APIs | ✗ | — | Never |
| AI modifies Redis | ✗ | — | Never |
| AI modifies experiments | ✗ | — | Never |
| Crisp / Detailed response modes | ✗ | ✓ | Future enhancement |
| RAG / vector retrieval | ✗ | ✓ | Only if current approach insufficient |

## Audit and history

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Audit log (create/update/delete/import/verify) | ✓ | | |
| Before/after diff in audit | ✓ | | |
| Role change audit | ✓ | | |
| Environment execution audit | ✗ | ✓ | QA Utility |

## Deployment and infrastructure

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Docker containerization | ✓ | | |
| AWS/Kubernetes staging readiness | ✓ | | |
| MongoDB authenticated access (staging) | ✓ | | Kubernetes Secrets |
| Secure session cookie (staging) | ✓ | | secure=True on HTTPS |
| CORS restricted to frontend origin | ✓ | | |
| No secrets in Git or images | ✓ | | |
| Health check endpoint | ✓ | | |
| Structured logging (no credentials) | ✓ | | |
| Error responses without stack traces | ✓ | | |
| Non-root containers | ✓ (where practical) | | |
| Public internet exposure | ✗ | — | Internal only |
| Public SaaS hardening | ✗ | — | Not required |

## QA Utility integration

| Item | V1 | V2+ | Notes |
|---|---|---|---|
| Redis execution | ✗ | ✓ | |
| Unleash/experiment execution | ✗ | ✓ | |
| Mock execution | ✗ | ✓ | |
| Automated test-state preparation | ✗ | ✓ | |
| Environment state verification | ✗ | ✓ | |
