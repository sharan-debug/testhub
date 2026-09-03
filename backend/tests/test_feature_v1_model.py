import pytest
from tests.conftest import register_and_login, seed_core_feature


@pytest.fixture
async def editor(client):
    await register_and_login(client, "editor@test.com", name="Ed User")
    return client


@pytest.fixture
async def cf_id():
    return await seed_core_feature("Checkout")


class TestFeatureCreate:
    async def test_owner_set_from_logged_in_user(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id, "owner": "ignored"})
        assert r.status_code == 200
        assert r.json()["owner"] == "Ed User"

    async def test_updated_by_set_on_create(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        assert r.status_code == 200
        assert r.json()["updated_by"] == "Ed User"

    async def test_jira_ticket_stored(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id, "jira_ticket": "PROJ-42"})
        assert r.status_code == 200
        assert r.json()["jira_ticket"] == "PROJ-42"

    async def test_default_status_is_active(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        assert r.status_code == 200
        assert r.json()["status"] == "active"


class TestFeatureUpdate:
    async def test_updated_by_set_on_update(self, editor, cf_id):
        create = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = create.json()["id"]
        r = await editor.put(f"/api/features/{fid}", json={"name": "F1 Updated"})
        assert r.status_code == 200
        assert r.json()["updated_by"] == "Ed User"

    async def test_invalid_status_rejected(self, editor, cf_id):
        create = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = create.json()["id"]
        r = await editor.put(f"/api/features/{fid}", json={"status": "draft"})
        assert r.status_code == 400
        assert r.json()["detail"]["error"]["code"] == "INVALID_STATUS"

    async def test_archive_feature(self, editor, cf_id):
        create = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = create.json()["id"]
        r = await editor.put(f"/api/features/{fid}", json={"status": "archived"})
        assert r.status_code == 200
        assert r.json()["status"] == "archived"


class TestApiCurl:
    async def test_curl_stored_and_returned(self, editor, cf_id):
        curl = "curl -X POST 'https://api.example.com/checkout' -H 'Content-Type: application/json'"
        r = await editor.post("/api/features", json={
            "name": "F1", "core_feature_id": cf_id,
            "apis": [{"curl": curl, "description": "Initiate checkout"}],
        })
        assert r.status_code == 200
        apis = r.json()["apis"]
        assert len(apis) == 1
        assert apis[0]["curl"] == curl
        assert apis[0]["description"] == "Initiate checkout"

    async def test_api_entry_has_no_method_or_path_fields(self, editor, cf_id):
        r = await editor.post("/api/features", json={
            "name": "F1", "core_feature_id": cf_id,
            "apis": [{"curl": "curl https://example.com", "description": ""}],
        })
        assert r.status_code == 200
        entry = r.json()["apis"][0]
        assert "method" not in entry
        assert "path" not in entry
        assert "sample_request" not in entry

    async def test_multiple_api_entries(self, editor, cf_id):
        r = await editor.post("/api/features", json={
            "name": "F1", "core_feature_id": cf_id,
            "apis": [
                {"curl": "curl https://api.example.com/a", "description": "endpoint A"},
                {"curl": "curl -X POST https://api.example.com/b", "description": "endpoint B"},
            ],
        })
        assert r.status_code == 200
        assert len(r.json()["apis"]) == 2


class TestVerify:
    async def test_verify_sets_metadata(self, editor, cf_id):
        create = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = create.json()["id"]
        r = await editor.post(f"/api/features/{fid}/verify")
        assert r.status_code == 200
        body = r.json()
        assert body["last_verified_by"] == "editor@test.com"
        assert body["last_verified_at"] is not None

    async def test_unauthenticated_cannot_verify(self, client, cf_id):
        # seed a feature id directly — no auth needed for the check
        r = await client.post("/api/features/feat_doesnotexist/verify")
        assert r.status_code == 401
