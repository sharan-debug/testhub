# TestHub V1 — Authentication

## Authentication strategy

TestHub V1 uses application-managed email/password authentication.

Google OAuth, Google Workspace, SSO, MFA and external identity providers are out of scope for V1.

## Registration

A user registers with:

- email address
- password

The application creates the account after validating the request.

## Credential storage

MongoDB stores:

- email (unique identifier)
- password hash

Plaintext passwords must never be stored.

## Login

1. User submits email and password.
2. Backend retrieves the user by email.
3. Backend verifies the supplied password against the stored hash.
4. Backend creates an authenticated session.
5. Frontend uses the authenticated session for subsequent requests.

## Identity

The authenticated email is the identity used by TestHub for:

- feature ownership
- editor history
- activity history
- audit records

## Session

Server-side sessions stored in MongoDB. Session token delivered as an HTTP-only cookie.

- Local development: `secure=False` (HTTP acceptable locally)
- Staging/production: `secure=True` (HTTPS required)

Session expiry and rotation strategy is an implementation detail defined in `ARCHITECTURE.md`.

## Authorization

V1 roles:

- Viewer
- Editor
- Approver
- Admin

Role assignment is admin-controlled. Backend enforces role checks. Frontend may hide UI for unauthorized actions, but backend is the authority.

## Network access

TestHub is deployed within the organization's internal AWS/Kubernetes staging infrastructure. The application is not intended to be publicly accessible. Application-level authentication is still enforced independently of network controls.

## Out of scope for V1

- Google OAuth
- Google Workspace integration
- SSO
- MFA
- Email verification
- Password reset
- External identity providers
- Invitation-based registration
