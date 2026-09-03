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
