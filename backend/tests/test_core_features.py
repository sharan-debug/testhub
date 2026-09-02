import pytest
from tests.conftest import register_and_login, set_role, seed_core_feature


@pytest.fixture
async def admin_client(client):
    await register_and_login(client, "admin@test.com", name="Admin")
    await set_role("admin@test.com", "admin")
    await client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Password1!"})
    return client


@pytest.fixture
async def editor_client(client):
    await register_and_login(client, "editor@test.com", name="Editor")
    return client


async def create_cf(client, name="Payments", description=""):
    return await client.post("/api/core-features", json={"name": name, "description": description})


class TestCoreFeatureCreate:
    async def test_admin_can_create(self, admin_client):
        r = await create_cf(admin_client, "Payments")
        assert r.status_code == 200
        body = r.json()
        assert body["name"] == "Payments"
        assert body["id"].startswith("cf_")
        assert body["status"] == "active"

    async def test_duplicate_name_rejected(self, admin_client):
        await create_cf(admin_client, "Payments")
        r = await create_cf(admin_client, "payments")  # case-insensitive
        assert r.status_code == 400
        assert r.json()["detail"]["error"]["code"] == "DUPLICATE_CORE_FEATURE"

    async def test_non_admin_cannot_create(self, editor_client):
        r = await create_cf(editor_client, "Payments")
        assert r.status_code == 403

    async def test_unauthenticated_cannot_create(self, client):
        r = await client.post("/api/core-features", json={"name": "Payments"})
        assert r.status_code == 401


class TestCoreFeatureGet:
    async def test_get_returns_active_only(self, admin_client):
        await create_cf(admin_client, "Alpha")
        await create_cf(admin_client, "Beta")
        r = await admin_client.get("/api/core-features")
        assert r.status_code == 200
        names = [cf["name"] for cf in r.json()]
        assert "Alpha" in names and "Beta" in names

    async def test_get_sorted_by_name(self, admin_client):
        await create_cf(admin_client, "Zed")
        await create_cf(admin_client, "Alpha")
        r = await admin_client.get("/api/core-features")
        names = [cf["name"] for cf in r.json()]
        assert names == sorted(names)


class TestCoreFeatureUpdate:
    async def test_admin_can_update(self, admin_client):
        r = await create_cf(admin_client, "Precancellation")
        cf_id = r.json()["id"]
        r2 = await admin_client.put(f"/api/core-features/{cf_id}", json={"name": "Pre-cancellation"})
        assert r2.status_code == 200
        assert r2.json()["name"] == "Pre-cancellation"

    async def test_non_admin_cannot_update(self, client):
        # Set up admin, create CF, then switch to editor — all with one client to avoid shared-cookie collision
        cf_id = await seed_core_feature("Precancellation")
        await register_and_login(client, "editor@test.com", name="Editor")
        r = await client.put(f"/api/core-features/{cf_id}", json={"name": "Changed"})
        assert r.status_code == 403


class TestFeatureRequiresCoreFeature:
    async def test_feature_create_blocked_without_core_feature_id(self, editor_client):
        r = await editor_client.post("/api/features", json={"name": "Test Feature", "core_feature_id": ""})
        assert r.status_code == 400
        assert r.json()["detail"]["error"]["code"] == "INVALID_CORE_FEATURE"

    async def test_feature_create_blocked_with_invalid_core_feature_id(self, editor_client):
        r = await editor_client.post("/api/features", json={"name": "Test Feature", "core_feature_id": "cf_nonexistent"})
        assert r.status_code == 400
        assert r.json()["detail"]["error"]["code"] == "INVALID_CORE_FEATURE"

    async def test_feature_create_succeeds_with_valid_core_feature_id(self, client):
        # Seed CF directly, then act as editor — avoids shared-client login collision
        cf_id = await seed_core_feature("Checkout")
        await register_and_login(client, "editor@test.com", name="Editor")
        r = await client.post("/api/features", json={"name": "Test Feature", "core_feature_id": cf_id})
        assert r.status_code == 200
        assert r.json()["core_feature_id"] == cf_id
