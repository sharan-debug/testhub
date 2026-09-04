import pytest
from tests.conftest import register_and_login, seed_core_feature


@pytest.fixture
async def editor(client):
    await register_and_login(client, "editor@test.com", name="Ed User")
    return client


@pytest.fixture
async def cf_id():
    return await seed_core_feature("Search CF")


async def _create(client, cf_id, **kwargs):
    payload = {"name": "Feature", "core_feature_id": cf_id, **kwargs}
    r = await client.post("/api/features", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


class TestSearch:
    async def test_search_by_name(self, editor, cf_id):
        await _create(editor, cf_id, name="Cancellation Flow")
        await _create(editor, cf_id, name="Checkout Process")
        r = await editor.get("/api/features?q=cancel")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "Cancellation Flow"

    async def test_search_by_description(self, editor, cf_id):
        await _create(editor, cf_id, name="F1", description="user downgrades their subscription plan")
        await _create(editor, cf_id, name="F2", description="payment processing flow")
        r = await editor.get("/api/features?q=downgrade")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "F1"

    async def test_search_by_test_data(self, editor, cf_id):
        await _create(editor, cf_id, name="F1", test_data="user_id: 123456\nplan: premium")
        await _create(editor, cf_id, name="F2", test_data="user_id: 999")
        r = await editor.get("/api/features?q=premium")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "F1"

    async def test_search_by_redis_key(self, editor, cf_id):
        await _create(editor, cf_id, name="F1", redis_keys=[{"key": "r:jar:cancellation:{user_id}", "description": ""}])
        await _create(editor, cf_id, name="F2", redis_keys=[{"key": "r:jar:checkout:{user_id}", "description": ""}])
        r = await editor.get("/api/features?q=cancellation")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "F1"

    async def test_search_by_curl(self, editor, cf_id):
        await _create(editor, cf_id, name="F1", apis=[{"curl": "curl -X POST https://api.example.com/cancel", "description": ""}])
        await _create(editor, cf_id, name="F2", apis=[{"curl": "curl https://api.example.com/checkout", "description": ""}])
        r = await editor.get("/api/features?q=cancel")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "F1"

    async def test_search_by_experiment_key(self, editor, cf_id):
        await _create(editor, cf_id, name="F1", experiments=[{"key": "CANCELLATION_FLOW_V2", "description": "CONTROL / TEST"}])
        await _create(editor, cf_id, name="F2", experiments=[{"key": "CHECKOUT_AB", "description": "VARIANT_A / VARIANT_B"}])
        r = await editor.get("/api/features?q=CANCELLATION_FLOW")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "F1"

    async def test_search_by_jira_ticket(self, editor, cf_id):
        await _create(editor, cf_id, name="F1", jira_ticket="PROJ-123")
        await _create(editor, cf_id, name="F2", jira_ticket="PROJ-456")
        r = await editor.get("/api/features?q=PROJ-123")
        results = r.json()
        assert len(results) == 1
        assert results[0]["name"] == "F1"

    async def test_search_no_results(self, editor, cf_id):
        await _create(editor, cf_id, name="Checkout Flow")
        r = await editor.get("/api/features?q=nonexistentxyz")
        assert r.json() == []

    async def test_no_query_returns_all(self, editor, cf_id):
        await _create(editor, cf_id, name="F1")
        await _create(editor, cf_id, name="F2")
        r = await editor.get("/api/features")
        assert len(r.json()) == 2

    async def test_search_case_insensitive(self, editor, cf_id):
        await _create(editor, cf_id, name="Cancellation Flow")
        r = await editor.get("/api/features?q=CANCELLATION")
        assert len(r.json()) == 1
