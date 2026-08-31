# TestHub V1 — Authentication

## Authentication Strategy

TestHub V1 uses application-managed username/password authentication.

Google OAuth, Google Workspace, SSO, MFA and external identity
providers are out of scope for V1.

## Registration

A user registers with:

- username
- password

The application creates the user account after validating the
registration request.

## Credential Storage

MongoDB stores:

- username
- password hash

Plaintext passwords must never be stored.

## Login

The login flow:

1. User submits username and password.
2. Backend retrieves the user by username.
3. Backend verifies the supplied password against the stored hash.
4. Backend creates an authenticated session/token.
5. Frontend uses the authenticated state for subsequent requests.

## Identity

The authenticated username is the identity used by TestHub for:

- ownership
- editor history
- activity history
- audit records

## Authorization

V1 supports these conceptual roles:

- Viewer
- Editor
- Approver
- Admin

Role assignment and permission management should remain simple
for V1 and be controlled by the administrator.

## Network Access

TestHub is intended for internal/staging use and should be deployed
behind the company's existing network/VPN controls.

Application authentication must still be enforced even when the
application is accessible only through the internal network.

## Out of Scope

- Google OAuth
- Google Workspace integration
- SSO
- MFA
- Email verification
- Password reset
- External identity providers