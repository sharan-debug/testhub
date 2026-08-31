# Google Workspace Authentication — TestHub

## Decision

TestHub should use Google OAuth for login.

There is no local registration/password flow in production V1.

## Important clarification

The Google Workspace Marketplace URL supplied for the project is:

https://workspace.google.com/marketplace?pann=ogb

That page confirms the existence of the Google Workspace Marketplace and access to Workspace applications, but it does NOT by itself prove that the company's email domain is managed by Google Workspace or establish the company's OAuth configuration.

Before production, verify with the company's Google Workspace/Cloud administrator:
- company Workspace domain
- whether the Google Cloud project can use an Internal OAuth consent screen
- whether internal apps are allowed
- whether third-party/internal OAuth apps require allowlisting
- approved redirect URI
- approved JavaScript origin if applicable
- whether the application must be VPN-only
- whether any corporate SSO layer is enforced

## Recommended V1 flow

```text
Browser
  |
  v
TestHub /auth/google/start
  |
  v
Google Authorization
  |
  v
Google callback
  |
  v
TestHub backend
  |
  +-- validate identity
  +-- validate allowed domain / organization
  +-- find or create user
  +-- assign stored TestHub role
  +-- establish secure session
  |
  v
Dashboard
```

## Scope minimization

TestHub only needs identity for V1.

Do not request Drive, Gmail, Sheets, Calendar or other Workspace scopes unless a concrete future feature requires them.

## Local development

Use a localhost redirect URI for development.

Production must use the approved HTTPS redirect URI.

## Secrets

Keep:
- Google client ID
- Google client secret
- session secrets

in backend environment/secret management.

Never put client secrets in React.

## Production note

Google's current web-server OAuth documentation supports authorization-code based web applications and requires secure redirect URI configuration. See official Google OAuth documentation before implementation.
