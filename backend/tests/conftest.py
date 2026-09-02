import os
import pytest
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "testhub_test")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

from server import app, db


@pytest.fixture(autouse=True)
async def clean_db():
    """Drop test collections before each test."""
    await db.users.drop()
    await db.user_sessions.drop()
    await db.features.drop()
    await db.activity.drop()
    yield
    await db.users.drop()
    await db.user_sessions.drop()
    await db.features.drop()
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
