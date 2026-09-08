import pytest
from tests.conftest import register_and_login, seed_core_feature


@pytest.fixture
async def editor(client):
    await register_and_login(client, "sd_editor@test.com", name="SD Editor")
    return client


@pytest.fixture
async def cf_id():
    return await seed_core_feature("SoftDel CF")


async def _create(client, cf_id, name="Feature X"):
    r = await client.post("/api/features", json={"name": name, "core_feature_id": cf_id})
    assert r.status_code == 200
    return r.json()["id"]


class TestSoftDelete:
    async def test_delete_returns_ok(self, editor, cf_id):
        fid = await _create(editor, cf_id)
        r = await editor.delete(f"/api/features/{fid}")
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    async def test_deleted_feature_excluded_from_list(self, editor, cf_id):
        fid = await _create(editor, cf_id, "ToBeGone")
        await editor.delete(f"/api/features/{fid}")
        r = await editor.get("/api/features")
        ids = [f["id"] for f in r.json()]
        assert fid not in ids

    async def test_deleted_feature_returns_404_on_get(self, editor, cf_id):
        fid = await _create(editor, cf_id)
        await editor.delete(f"/api/features/{fid}")
        r = await editor.get(f"/api/features/{fid}")
        assert r.status_code == 404

    async def test_update_on_deleted_feature_returns_404(self, editor, cf_id):
        fid = await _create(editor, cf_id)
        await editor.delete(f"/api/features/{fid}")
        r = await editor.put(f"/api/features/{fid}", json={"description": "nope"})
        assert r.status_code == 404

    async def test_verify_on_deleted_feature_returns_404(self, editor, cf_id):
        fid = await _create(editor, cf_id)
        await editor.delete(f"/api/features/{fid}")
        r = await editor.post(f"/api/features/{fid}/verify")
        assert r.status_code == 404

    async def test_second_delete_returns_404(self, editor, cf_id):
        fid = await _create(editor, cf_id)
        await editor.delete(f"/api/features/{fid}")
        r = await editor.delete(f"/api/features/{fid}")
        assert r.status_code == 404

    async def test_deleted_not_counted_as_duplicate_in_preview(self, editor, cf_id):
        fid = await _create(editor, cf_id, "Reimportable")
        await editor.delete(f"/api/features/{fid}")
        import io
        csv = b"name\nReimportable\n"
        r = await editor.post(
            "/api/features/import/preview",
            files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["duplicates"] == 0
        assert data["rows"][0]["is_duplicate"] is False

    async def test_history_still_accessible_after_delete(self, editor, cf_id):
        fid = await _create(editor, cf_id, "WillDelete")
        await editor.delete(f"/api/features/{fid}")
        r = await editor.get(f"/api/features/{fid}/history")
        assert r.status_code == 200
        actions = [e["action"] for e in r.json()]
        assert "created" in actions
        assert "deleted" in actions


class TestAuditDiff:
    async def test_update_stores_changed_fields(self, editor, cf_id):
        fid = await _create(editor, cf_id, "DiffMe")
        await editor.put(f"/api/features/{fid}", json={"description": "new desc"})
        h = await editor.get(f"/api/features/{fid}/history")
        update_events = [e for e in h.json() if e["action"] == "updated"]
        assert len(update_events) == 1
        assert "description" in update_events[0]["changed_fields"]

    async def test_unchanged_fields_not_in_changed_fields(self, editor, cf_id):
        fid = await _create(editor, cf_id, "DiffMe2")
        await editor.put(f"/api/features/{fid}", json={"description": "updated"})
        h = await editor.get(f"/api/features/{fid}/history")
        update_events = [e for e in h.json() if e["action"] == "updated"]
        changed = update_events[0]["changed_fields"]
        assert "name" not in changed
        assert "test_data" not in changed

    async def test_multiple_changed_fields_all_recorded(self, editor, cf_id):
        fid = await _create(editor, cf_id, "DiffMe3")
        await editor.put(f"/api/features/{fid}", json={
            "description": "d", "test_data": "td", "tags": ["x"]
        })
        h = await editor.get(f"/api/features/{fid}/history")
        update_events = [e for e in h.json() if e["action"] == "updated"]
        changed = update_events[0]["changed_fields"]
        assert "description" in changed
        assert "test_data" in changed
        assert "tags" in changed

    async def test_create_and_verify_have_no_changed_fields(self, editor, cf_id):
        fid = await _create(editor, cf_id, "NoChanges")
        await editor.post(f"/api/features/{fid}/verify")
        h = await editor.get(f"/api/features/{fid}/history")
        for event in h.json():
            if event["action"] in ("created", "verified"):
                assert "changed_fields" not in event or event.get("changed_fields") is None
