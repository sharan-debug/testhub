import io
import pytest
import pandas as pd
from tests.conftest import register_and_login


def _csv(rows: list[dict]) -> bytes:
    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


def _file(content: bytes, filename: str = "import.csv"):
    return ("file", (filename, content, "text/csv"))


@pytest.fixture
async def editor(client):
    await register_and_login(client, "editor@test.com", name="Ed User")
    return client


class TestImportPreview:
    async def test_preview_returns_rows_without_inserting(self, editor):
        csv = _csv([{"name": "Feature A", "description": "desc"}, {"name": "Feature B"}])
        r = await editor.post("/api/features/import/preview", files=[_file(csv)])
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 2
        assert len(body["rows"]) == 2
        assert body["rows"][0]["name"] == "Feature A"
        assert body["rows"][1]["name"] == "Feature B"
        # nothing was written
        count = await editor.get("/api/features")
        assert count.json() == []

    async def test_preview_detects_duplicates(self, editor):
        # seed a feature with the same name
        csv_seed = _csv([{"name": "Checkout Flow"}])
        await editor.post("/api/features/import", files=[_file(csv_seed)], data={"skip_duplicates": "false"})

        csv_preview = _csv([{"name": "Checkout Flow"}, {"name": "New Feature"}])
        r = await editor.post("/api/features/import/preview", files=[_file(csv_preview)])
        assert r.status_code == 200
        body = r.json()
        assert body["duplicates"] == 1
        dup_row = next(row for row in body["rows"] if row["name"] == "Checkout Flow")
        assert dup_row["is_duplicate"] is True
        new_row = next(row for row in body["rows"] if row["name"] == "New Feature")
        assert new_row["is_duplicate"] is False

    async def test_preview_skips_blank_name_rows(self, editor):
        csv = _csv([{"name": "Real Feature"}, {"name": ""}, {"name": "   "}])
        r = await editor.post("/api/features/import/preview", files=[_file(csv)])
        assert r.status_code == 200
        assert r.json()["total"] == 1

    async def test_preview_requires_editor(self, client):
        await register_and_login(client, "viewer@test.com", name="Viewer")
        from tests.conftest import set_role
        await set_role("viewer@test.com", "viewer")
        csv = _csv([{"name": "F1"}])
        r = await client.post("/api/features/import/preview", files=[_file(csv)])
        assert r.status_code == 403

    async def test_preview_unauthenticated(self, client):
        csv = _csv([{"name": "F1"}])
        r = await client.post("/api/features/import/preview", files=[_file(csv)])
        assert r.status_code == 401


class TestImportConfirm:
    async def test_import_inserts_rows(self, editor):
        csv = _csv([{"name": "Feature A"}, {"name": "Feature B"}])
        r = await editor.post("/api/features/import", files=[_file(csv)], data={"skip_duplicates": "false"})
        assert r.status_code == 200
        assert r.json()["imported"] == 2
        assert r.json()["skipped"] == 0

    async def test_skip_duplicates_true_skips_existing(self, editor):
        csv = _csv([{"name": "Feature A"}])
        await editor.post("/api/features/import", files=[_file(csv)], data={"skip_duplicates": "false"})

        csv2 = _csv([{"name": "Feature A"}, {"name": "Feature B"}])
        r = await editor.post("/api/features/import", files=[_file(csv2)], data={"skip_duplicates": "true"})
        assert r.status_code == 200
        assert r.json()["imported"] == 1
        assert r.json()["skipped"] == 1

    async def test_skip_duplicates_false_imports_all(self, editor):
        csv = _csv([{"name": "Feature A"}])
        await editor.post("/api/features/import", files=[_file(csv)], data={"skip_duplicates": "false"})

        csv2 = _csv([{"name": "Feature A"}])
        r = await editor.post("/api/features/import", files=[_file(csv2)], data={"skip_duplicates": "false"})
        assert r.status_code == 200
        assert r.json()["imported"] == 1
        assert r.json()["skipped"] == 0

    async def test_import_accepts_api_column(self, editor):
        csv = _csv([{"name": "F1", "api": "curl https://api.example.com"}])
        r = await editor.post("/api/features/import", files=[_file(csv)], data={"skip_duplicates": "false"})
        assert r.status_code == 200
        features = (await editor.get("/api/features")).json()
        assert features[0]["apis"][0]["curl"] == "curl https://api.example.com"

    async def test_import_rejects_unsupported_format(self, editor):
        r = await editor.post(
            "/api/features/import",
            files=[("file", ("import.txt", b"name\nF1", "text/plain"))],
            data={"skip_duplicates": "false"},
        )
        assert r.status_code == 400
