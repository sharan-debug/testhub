import os
import pytest
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "testhub_test")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

from server import app
from database import db


@pytest.fixture(autouse=True)
async def clean_db():
    """Drop test collections before each test."""
    await db.users.drop()
    await db.user_sessions.drop()
    await db.features.drop()
    await db.core_features.drop()
    await db.activity.drop()
    yield
    await db.users.drop()
    await db.user_sessions.drop()
    await db.features.drop()
    await db.core_features.drop()
    await db.activity.drop()


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


async def register_and_login(client, email: str, password: str = "Password1!", name: str = "Test User"):
    await client.post("/api/auth/register", json={"email": email, "password": password, "name": name})
    resp = await client.post("/api/auth/login", json={"email": email, "password": password})
    return resp


async def set_role(email: str, role: str):
    """Directly set a user's role in the DB (simulates admin MongoDB command)."""
    await db.users.update_one({"email": email}, {"$set": {"role": role}})


async def seed_core_feature(name: str = "Test Core Feature") -> str:
    """Insert a core feature directly into the DB and return its id."""
    import uuid
    from datetime import datetime, timezone
    cf_id = f"cf_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    await db.core_features.insert_one({
        "id": cf_id,
        "name": name,
        "description": "",
        "status": "active",
        "created_by": "seed",
        "created_at": now,
        "updated_at": now,
    })
    return cf_id
