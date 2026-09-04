import pytest
from tests.conftest import register_and_login, seed_core_feature


@pytest.fixture
async def editor(client):
    await register_and_login(client, "editor@test.com", name="Ed User")
    return client


@pytest.fixture
async def cf_id():
    return await seed_core_feature("History CF")


class TestFeatureHistory:
    async def test_create_logged(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = r.json()["id"]
        h = await editor.get(f"/api/features/{fid}/history")
        assert h.status_code == 200
        events = h.json()
        assert len(events) == 1
        assert events[0]["action"] == "created"
        assert events[0]["feature_id"] == fid
        assert events[0]["user_name"] == "Ed User"

    async def test_update_logged(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = r.json()["id"]
        await editor.put(f"/api/features/{fid}", json={"name": "F1 Updated"})
        h = await editor.get(f"/api/features/{fid}/history")
        actions = [e["action"] for e in h.json()]
        assert "updated" in actions
        assert "created" in actions

    async def test_verify_logged(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = r.json()["id"]
        await editor.post(f"/api/features/{fid}/verify")
        h = await editor.get(f"/api/features/{fid}/history")
        actions = [e["action"] for e in h.json()]
        assert "verified" in actions

    async def test_history_sorted_newest_first(self, editor, cf_id):
        r = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        fid = r.json()["id"]
        await editor.put(f"/api/features/{fid}", json={"name": "F1 v2"})
        await editor.post(f"/api/features/{fid}/verify")
        events = (await editor.get(f"/api/features/{fid}/history")).json()
        assert events[0]["action"] == "verified"
        assert events[-1]["action"] == "created"

    async def test_history_scoped_to_feature(self, editor, cf_id):
        r1 = await editor.post("/api/features", json={"name": "F1", "core_feature_id": cf_id})
        r2 = await editor.post("/api/features", json={"name": "F2", "core_feature_id": cf_id})
        fid1, fid2 = r1.json()["id"], r2.json()["id"]
        await editor.put(f"/api/features/{fid2}", json={"name": "F2 updated"})
        h = (await editor.get(f"/api/features/{fid1}/history")).json()
        assert all(e["feature_id"] == fid1 for e in h)

    async def test_history_requires_auth(self, client, cf_id):
        r = (await client.get("/api/features")).json()
        h = await client.get("/api/features/nonexistent/history")
        assert h.status_code == 401

    async def test_empty_history_for_unknown_feature(self, editor):
        h = await editor.get("/api/features/feat_doesnotexist/history")
        assert h.status_code == 200
        assert h.json() == []
