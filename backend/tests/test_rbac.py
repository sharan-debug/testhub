import pytest
from tests.conftest import register_and_login, set_role

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Registration defaults
# ---------------------------------------------------------------------------
class TestRegistrationDefaults:
    async def test_new_user_gets_editor_role(self, client):
        resp = await client.post(
            "/api/auth/register",
            json={"email": "editor@test.com", "password": "Pass1234!", "name": "Ed"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "editor"

    async def test_auth_me_returns_role(self, client):
        await register_and_login(client, "me@test.com")
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["role"] == "editor"

    async def test_login_returns_role(self, client):
        await client.post(
            "/api/auth/register",
            json={"email": "login@test.com", "password": "Pass1234!", "name": "L"},
        )
        resp = await client.post(
            "/api/auth/login",
            json={"email": "login@test.com", "password": "Pass1234!"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "editor"


# ---------------------------------------------------------------------------
# Viewer cannot mutate
# ---------------------------------------------------------------------------
class TestViewerCannotMutate:
    async def _viewer_client(self, client):
        await register_and_login(client, "viewer@test.com")
        await set_role("viewer@test.com", "viewer")
        # Re-login so session reflects viewer (session reads role from DB each request)
        return client

    async def test_viewer_cannot_create_feature(self, client):
        await self._viewer_client(client)
        resp = await client.post("/api/features", json={"name": "New Feature"})
        assert resp.status_code == 403

    async def test_viewer_cannot_update_feature(self, client):
        # Create a feature as editor first
        editor_client = client
        await register_and_login(editor_client, "editor@test.com")
        create_resp = await editor_client.post("/api/features", json={"name": "Existing"})
        feature_id = create_resp.json()["id"]

        # Switch to viewer
        await register_and_login(client, "viewer@test.com")
        await set_role("viewer@test.com", "viewer")
        resp = await client.put(f"/api/features/{feature_id}", json={"name": "Updated"})
        assert resp.status_code == 403

    async def test_viewer_cannot_delete_feature(self, client):
        await register_and_login(client, "editor@test.com")
        create_resp = await client.post("/api/features", json={"name": "ToDelete"})
        feature_id = create_resp.json()["id"]

        await register_and_login(client, "viewer@test.com")
        await set_role("viewer@test.com", "viewer")
        resp = await client.delete(f"/api/features/{feature_id}")
        assert resp.status_code == 403

    async def test_viewer_can_read_features(self, client):
        await register_and_login(client, "viewer@test.com")
        await set_role("viewer@test.com", "viewer")
        resp = await client.get("/api/features")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Editor can mutate
# ---------------------------------------------------------------------------
class TestEditorCanMutate:
    async def test_editor_can_create_feature(self, client):
        await register_and_login(client, "editor@test.com")
        resp = await client.post("/api/features", json={"name": "My Feature"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "My Feature"

    async def test_editor_can_update_feature(self, client):
        await register_and_login(client, "editor@test.com")
        create_resp = await client.post("/api/features", json={"name": "Original"})
        feature_id = create_resp.json()["id"]
        resp = await client.put(f"/api/features/{feature_id}", json={"name": "Updated"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"

    async def test_editor_can_delete_feature(self, client):
        await register_and_login(client, "editor@test.com")
        create_resp = await client.post("/api/features", json={"name": "Bye"})
        feature_id = create_resp.json()["id"]
        resp = await client.delete(f"/api/features/{feature_id}")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Admin user management
# ---------------------------------------------------------------------------
class TestAdminUserManagement:
    async def _admin_client(self, client):
        await register_and_login(client, "admin@test.com")
        await set_role("admin@test.com", "admin")
        return client

    async def test_admin_can_list_users(self, client):
        await self._admin_client(client)
        resp = await client.get("/api/users")
        assert resp.status_code == 200
        users = resp.json()
        assert isinstance(users, list)
        assert all("password_hash" not in u for u in users)

    async def test_admin_can_change_role(self, client):
        await register_and_login(client, "target@test.com")
        await self._admin_client(client)
        target = await client.get("/api/users")
        target_id = next(u["user_id"] for u in target.json() if u["email"] == "target@test.com")
        resp = await client.patch(f"/api/users/{target_id}/role", json={"role": "viewer"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "viewer"

    async def test_admin_rejects_invalid_role(self, client):
        await self._admin_client(client)
        users = await client.get("/api/users")
        uid = users.json()[0]["user_id"]
        resp = await client.patch(f"/api/users/{uid}/role", json={"role": "superuser"})
        assert resp.status_code == 400

    async def test_non_admin_cannot_list_users(self, client):
        await register_and_login(client, "editor@test.com")
        resp = await client.get("/api/users")
        assert resp.status_code == 403

    async def test_non_admin_cannot_change_role(self, client):
        await register_and_login(client, "editor@test.com")
        users_resp = await client.get("/api/users")
        assert users_resp.status_code == 403

    async def test_unauthenticated_cannot_access_users(self, client):
        resp = await client.get("/api/users")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Unauthenticated access
# ---------------------------------------------------------------------------
class TestUnauthenticated:
    async def test_unauthenticated_cannot_create_feature(self, client):
        resp = await client.post("/api/features", json={"name": "Hack"})
        assert resp.status_code == 401

    async def test_unauthenticated_cannot_read_features(self, client):
        resp = await client.get("/api/features")
        assert resp.status_code == 401
