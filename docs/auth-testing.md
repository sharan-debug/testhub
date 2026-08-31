
Action: file_editor create /app/auth_testing.md --file-text "# Auth Testing Playbook — TestHub (Emergent Google Auth)

## Step 1: Create Test User & Session
```
mongosh --eval \"
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
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

## Step 2: Test Backend API
```
curl -X GET \"$REACT_APP_BACKEND_URL/api/auth/me\" \
  -H \"Authorization: Bearer YOUR_SESSION_TOKEN\"

curl -X GET \"$REACT_APP_BACKEND_URL/api/features\" \
  -H \"Authorization: Bearer YOUR_SESSION_TOKEN\"

curl -X POST \"$REACT_APP_BACKEND_URL/api/features\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer YOUR_SESSION_TOKEN\" \
  -d '{\"name\": \"Checkout Flow\", \"tags\": [\"checkout\",\"payments\"]}'
```

## Step 3: Browser Testing (Playwright)
```
await page.context.add_cookies([{
  \"name\": \"session_token\",
  \"value\": \"YOUR_SESSION_TOKEN\",
  \"domain\": \"<host>\",
  \"path\": \"/\",
  \"httpOnly\": True,
  \"secure\": True,
  \"sameSite\": \"None\"
}]);
await page.goto(\"<host>/\");
```

## Notes
- `session_token` acts both as cookie and bearer token
- All /api endpoints require auth EXCEPT /api/ (health)
- Chat endpoint /api/chat streams SSE — use `text/event-stream` reader

## Success indicators
- /api/auth/me returns { user_id, email, name, picture }
- Dashboard loads at \"/\" without redirect to /login
- POST /api/features returns created feature with id \"feat_...\"
"
`Observation: Create successful: /app/auth_testing.md`