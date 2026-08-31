# TestHub V1 — Product Decisions / Do Not Reintroduce

| Decision | V1 choice |
|---|---|
| Registration | Username/password registration; no Google OAuth |
| Authentication | MongoDB-backed username/password authentication |
| Password storage | Passwords must never be stored in plaintext; store password hash |
| Roles | Viewer / Editor / Approver / Admin |
| Initial role management | Admin-controlled; keep implementation simple in V1 |
| Test Scenarios | V2, not required in V1 |
| Jira | Optional field now; API integration V2 |
| Redis | Store key/pattern only |
| Redis value/TTL | Not required |
| Experiments | Name + simple options/required option |
| Experiment explanation | Optional free text |
| APIs | Store cURL text + optional description |
| API execution | Not allowed in V1 |
| Mongo collections | Store names only |
| Test Data | Free text |
| Test Steps | Free text |
| Mocking Steps | Free text |
| Relationships | V2 |
| Dependency graph | V2 |
| Conflict detection | V2 |
| Test-case import | Separate future import |
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
| Owner | Auto from authenticated creator |

## Authentication Decision

TestHub V1 uses application-managed username/password authentication.

Google OAuth / Google Workspace authentication is explicitly out of scope
for V1.

The application will:

- allow users to register with username and password
- authenticate users against credentials stored in MongoDB
- store only the username and a secure password hash
- require authentication before accessing TestHub
- use the authenticated username as the user's identity for ownership
  and TestHub audit history

Authentication implementation details are defined in:

- `docs/AUTHENTICATION.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/API_CONTRACT.md`

The authentication decision must not be changed back to Google OAuth
without an explicit product decision.