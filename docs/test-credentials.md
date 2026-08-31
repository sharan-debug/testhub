
Action: file_editor create /app/memory/test_credentials.md --file-text "# Test Credentials — TestHub

Auth provider: Emergent-managed Google OAuth (no app-managed passwords).

For automated testing, create a session directly in MongoDB:

```
mongosh --eval \"
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'qa.tester@example.com',
  name: 'QA Tester',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
\"
```

Then use `session_token` as either an httpOnly cookie or `Authorization: Bearer <token>` header.

No RBAC or allowlist — any authenticated user can create/edit/delete features.
"
Observation: Overwrite successful: /app/memory/test_credentials.md