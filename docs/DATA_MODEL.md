# TestHub V1 — Data Model

## Collections

- `users`
- `core_features`
- `features`
- `audit_logs`
- `imports`

## users

```json
{
  "_id": "ObjectId",
  "email": "user@company.in",
  "name": "User Name",
  "picture": "https://...",
  "role": "viewer",
  "status": "active",
  "createdAt": "UTC datetime",
  "lastLoginAt": "UTC datetime"
}
```

## core_features

```json
{
  "_id": "ObjectId",
  "name": "Precancellation",
  "description": "Optional",
  "status": "active",
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId",
  "createdAt": "UTC datetime",
  "updatedAt": "UTC datetime"
}
```

Recommended unique index:
- normalized name

## features

```json
{
  "_id": "ObjectId",
  "name": "Precancellation cancellation eligibility",
  "coreFeatureId": "ObjectId",
  "jiraTicket": "ABC-123",
  "description": "Markdown/text",
  "ownerId": "ObjectId",
  "tags": ["precancellation"],
  "testData": "Markdown/text",
  "testSteps": "Markdown/text",
  "mockingSteps": "Markdown/text",
  "notes": "Free text — catch-all for any additional information",

  "apis": [
    {
      "id": "uuid",
      "curl": "raw text",
      "description": "Optional"
    }
  ],

  "attachments": [
    {
      "id": "uuid",
      "filename": "collection.json",
      "contentType": "application/json",
      "size": 12345,
      "uploadedBy": "email",
      "uploadedAt": "UTC datetime",
      "description": "Optional — e.g. Postman collection"
    }
  ],

  "mongoCollections": [
    "users"
  ],

  "redisKeys": [
    "r:jar:cancellation:{user_id}"
  ],

  "experiments": [
    {
      "id": "uuid",
      "name": "precancellation-exp",
      "options": ["CONTROL", "TEST"],
      "required": "TEST"
    }
  ],

  "createdBy": "ObjectId",
  "updatedBy": "ObjectId",
  "createdAt": "UTC datetime",
  "updatedAt": "UTC datetime",
  "lastVerifiedAt": "UTC datetime",
  "lastVerifiedBy": "ObjectId",
  "status": "active"
}
```

### Field notes

- `notes` — general free-text catch-all. Not the same as `description` (which describes the feature), `testData`, `testSteps` or `mockingSteps`. Used for anything that doesn't fit neatly elsewhere.
- `attachments` — V1 scope is limited to API-related files (Postman collections, cURL JSON exports). File content stored in MongoDB GridFS; feature document holds the metadata reference only.
- MongoDB collections remain as a list of collection name strings. A managed dropdown of known DB collections is out of scope for V1 and V2.
- Tags are the mechanism for Platform/POD categorization — no separate field required.

### Do not embed

- scenarios
- dependency graphs
- Redis state or TTL
- execution history
- Unleash current state
- DB collection dropdown values

## audit_logs

```json
{
  "_id": "ObjectId",
  "entityType": "FEATURE",
  "entityId": "ObjectId",
  "action": "UPDATE",
  "actorId": "ObjectId",
  "timestamp": "UTC datetime",
  "changes": {
    "description": {
      "before": "old",
      "after": "new"
    }
  },
  "metadata": {
    "requestId": "..."
  }
}
```

Do not store sensitive credentials in audit logs.

For API/cURL fields, redact secrets before recording before/after values.

## imports

```json
{
  "_id": "ObjectId",
  "type": "FEATURE",
  "fileName": "features.csv",
  "uploadedBy": "ObjectId",
  "status": "PREVIEW|CONFIRMED|FAILED",
  "rowCount": 28,
  "createdCount": 20,
  "updatedCount": 6,
  "duplicateCount": 2,
  "errorCount": 0,
  "createdAt": "UTC datetime",
  "completedAt": "UTC datetime"
}
```

## V1 relationships

Only explicit relationship:
- `features.coreFeatureId -> core_features._id`
- `features.ownerId -> users._id`
- `features.createdBy -> users._id`
- `features.updatedBy -> users._id`
- `features.lastVerifiedBy -> users._id`

Do not infer relationships between Redis, experiments, mocks and features beyond the feature document where the user entered them.

## V2 evolution

Possible future entities:
- scenarios
- reusable assets
- feature_asset_links
- dependencies
- Jira references
- execution runs

## Users

Collection: `users`

V1 fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | MongoDB identifier |
| `username` | String | Yes | Unique user identity |
| `password_hash` | String | Yes | Secure password hash |
| `role` | String | Yes | viewer/editor/approver/admin |
| `created_at` | DateTime | Yes | Account creation time |
| `updated_at` | DateTime | Yes | Last update time |

Indexes:

- Unique index on `username`