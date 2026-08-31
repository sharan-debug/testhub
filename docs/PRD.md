# TestHub V1 — Product Requirements Document

## 1. Product

**TestHub — Centralized QA Knowledge Hub**

## 2. Problem

QA knowledge is scattered across Excel sheets, documents, developers, product members, Redis tooling, experiment tooling and individual team members' memory.

A representative task is testing Precancellation, where a QA may need to discover many experiments, Redis keys and mock conditions before testing a flow.

The current process can take 10–30 minutes and often requires asking developers/product/other QAs.

## 3. Product goal

Reduce the time required to discover the information needed to test a feature.

Initial success target:

> A QA should be able to find the relevant feature knowledge in under 60 seconds.

The V1 product does not attempt to automate the environment.

## 4. Product positioning

TestHub is NOT:
- a replacement for Jira
- a replacement for Redis UI
- a replacement for Unleash
- a replacement for the QA Utility
- a test-case management system
- a mandatory documentation workflow

TestHub IS:
- a centralized QA knowledge hub
- a searchable source of test information
- an easier alternative to asking people/searching scattered documents
- an AI-assisted interface over the stored QA knowledge

## 5. Target users

Primary:
- QA team

Secondary:
- Developers
- Product
- Product/analytics/design contributors
- Automation team

Expected initial user base: approximately 20 QA users plus selected other internal users, with room for approximately 50 users.

## 6. V1 product principles

1. Minimal manual effort.
2. Do not force detailed test scenarios.
3. Do not force structured dependency relationships.
4. Reuse the team's existing Excel data.
5. Make search/discovery better than Excel.
6. Make AI explain existing stored knowledge.
7. Capture edit history automatically.
8. Automate data capture wherever the application can know it automatically.

## 7. Authentication

Use Google Workspace authentication.

No registration page.
No local username/password authentication.

Access should be restricted to approved company users and the internal company network/VPN deployment boundary.

The exact Google Workspace domain and identity-admin configuration must be confirmed with the company's Google Workspace/Cloud administrator before production.

## 8. Authorization

Roles:
- Viewer
- Editor
- Approver
- Admin

### Viewer
- View
- Search
- Ask Agent

### Editor
- Viewer permissions
- Create
- Edit
- Import
- Update knowledge

### Approver
- Editor permissions
- Approval/governance actions that are implemented in V1

### Admin
- User/role administration
- System configuration

Do not build a complex approval workflow unless required for the first production deployment.

## 9. Feature structure

V1 feature fields:

### Required
- Core Feature
- Feature Name

### Automatically populated
- Owner/creator from authenticated user
- Created timestamp
- Updated timestamp
- Created by
- Updated by

### Optional
- Jira ticket
- Description
- Tags
- Test Data
- Test Steps
- Mocking Steps
- APIs
- MongoDB Collections
- Redis Keys
- Experiments / Flags

## 10. Core Feature

Core Feature is a mandatory dropdown.

Examples:
- Precancellation
- Homefeed
- Rewards
- Mandates
- KYC
- Payments

The exact list is admin-controlled.

## 11. Jira

Jira ticket is optional in V1.

A Jira field can be displayed in the Feature form now.

Jira API integration is a planned V2 capability.

V1 must not block feature creation because a Jira ticket is missing.

## 12. Redis

V1 stores only the key/pattern.

Example:
`r:jar:cancellation:{user_id}`

The user is not required to document the Redis value or TTL.

## 13. Experiments / Flags

V1 stores:
- name
- options when useful
- required option

Examples:
- CONTROL / TEST
- VARIANT_A / VARIANT_B

Do not force detailed experiment documentation.

## 14. APIs

APIs are primarily intended for the automation team.

Store:
- cURL text
- optional description

Do not execute cURL.
Do not expose credentials contained in imported cURL in UI logs or AI context unnecessarily.
Avoid logging full cURL if it may contain secrets.

## 15. Free-text knowledge

Keep these as free text/Markdown-capable fields:
- Description
- Test Data
- Test Steps
- Mocking Steps

Provide helpful placeholder examples, but do not enforce a template.

## 16. Quick Add

A user can:
1. Select Core Feature.
2. Enter Feature Name.
3. Paste notes/knowledge.
4. Save.

Quick Add exists specifically to overcome adoption resistance.

## 17. Import

### Existing Feature Import
Continue supporting the existing feature CSV/Excel structure.

Current fields are:
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

### Test Case Import
Add a separate option later.
Do not lock the schema until representative team spreadsheets are collected.

## 18. Search

Search across:
- Feature name
- Core Feature
- Jira ticket
- Description
- Tags
- Test Data
- Test Steps
- Mocking Steps
- API descriptions/cURL where appropriate
- MongoDB collections
- Redis keys
- Experiment names/options

## 19. AI Agent

Read-only V1.

Primary use cases:
- "What do I need to test Precancellation?"
- "Which Redis keys are documented for this feature?"
- "Which experiment should be enabled?"
- "What mock/API is relevant?"
- "Summarize the testing information for this feature."

AI should retrieve relevant TestHub records before answering.

AI should distinguish between:
- known stored information
- inference
- missing information

If information is missing, say so rather than inventing it.

## 20. AI source visibility

Answers should show the feature/section used as source context.

Example:

> Redis key: `r:jar:cancellation:{user_id}`
> Source: Precancellation → Redis Keys

## 21. Audit history

Track:
- create
- update
- delete
- import
- ownership changes
- role changes where applicable

Record:
- actor
- timestamp
- entity
- action
- changed fields
- before/after values where safe

This is TestHub knowledge history only.

Environment execution history belongs to the future QA Utility integration.

## 22. Last Verified

Feature should support:
- Last verified timestamp
- Last verified by

Provide a simple "Mark as Verified" action.

## 23. Non-goals for V1

- Test scenarios
- Test-state graph
- Dependency graph
- Conflict detection
- Automated Redis manipulation
- Automated Unleash manipulation
- Automated mock creation
- Environment setup
- Jira API integration
- Complex test-case import
- AI write actions
- AI environment execution

## 24. Success metrics

Primary:
- Time to find required feature knowledge
- Target: under 60 seconds

Secondary:
- Search usage
- AI questions answered
- Percentage of active features with recent verification
- Number of contributors
- Import adoption
- Repeat usage
- Reduction in "ask another person" support behavior

## 25. V2

- Test Scenarios
- Relationships
- Dependency discovery
- Conflict detection
- Jira API integration
- Test-case import
- AI-assisted enrichment
- QA Utility integration
- Environment state verification

## 26. V3

- Prepare Test State
- User confirmation
- QA Utility orchestration
- Redis/Unleash/mock execution
- State verification


### Authentication

TestHub is an internal application.

V1 uses username/password authentication.

Users can register and subsequently log in using their
registered credentials.

Google OAuth / Google Workspace authentication is not required
for V1.

Authenticated users can:

- view TestHub content according to their role
- create features if permitted
- edit permitted feature data
- view their TestHub activity/history

Authentication and authorization implementation details are
defined separately in `AUTHENTICATION.md` and `ARCHITECTURE.md`.