from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')

_mongo_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = _mongo_client[os.environ['DB_NAME']]


def shutdown_db():
    _mongo_client.close()


async def ensure_indexes():
    await db.features.create_index("id", unique=True)
    await db.features.create_index([("updated_at", -1)])
    await db.features.create_index("owner")
    await db.features.create_index("tags")
    await db.features.create_index("core_feature_id")
    await db.features.create_index("status")

    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")

    await db.core_features.create_index("id", unique=True)

    await db.activity.create_index([("created_at", -1)])
    await db.activity.create_index("feature_id")

    await db.chat_messages.create_index("session_id")
    await db.chat_messages.create_index([("timestamp", 1)])
