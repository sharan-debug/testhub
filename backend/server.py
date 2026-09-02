from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import logging
import uuid
import anthropic
import bcrypt
import pandas as pd
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

app = FastAPI(title="Test Knowledge Hub")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============================================================
# Role hierarchy
# ============================================================
ROLE_HIERARCHY = {"viewer": 0, "editor": 1, "approver": 2, "admin": 3}


# ============================================================
# Models
# ============================================================
def now_iso():
    return datetime.now(timezone.utc).isoformat()


class ApiEndpoint(BaseModel):
    method: str = "GET"
    path: str = ""
    description: str = ""
    sample_request: str = ""
    sample_response: str = ""


class KeyValueItem(BaseModel):
    key: str = ""
    description: str = ""


class Feature(BaseModel):
    id: str = Field(default_factory=lambda: f"feat_{uuid.uuid4().hex[:12]}")
    name: str
    description: str = ""
    owner: str = ""
    tags: List[str] = Field(default_factory=list)
    test_data: str = ""
    test_steps: str = ""
    mocking_steps: str = ""
    apis: List[ApiEndpoint] = Field(default_factory=list)
    mongo_collections: List[KeyValueItem] = Field(default_factory=list)
    redis_keys: List[KeyValueItem] = Field(default_factory=list)
    experiments: List[KeyValueItem] = Field(default_factory=list)
    contributors: List[str] = Field(default_factory=list)
    created_by: str = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class FeatureCreate(BaseModel):
    name: str
    description: str = ""
    owner: str = ""
    tags: List[str] = Field(default_factory=list)
    test_data: str = ""
    test_steps: str = ""
    mocking_steps: str = ""
    apis: List[ApiEndpoint] = Field(default_factory=list)
    mongo_collections: List[KeyValueItem] = Field(default_factory=list)
    redis_keys: List[KeyValueItem] = Field(default_factory=list)
    experiments: List[KeyValueItem] = Field(default_factory=list)


class FeatureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    tags: Optional[List[str]] = None
    test_data: Optional[str] = None
    test_steps: Optional[str] = None
    mocking_steps: Optional[str] = None
    apis: Optional[List[ApiEndpoint]] = None
    mongo_collections: Optional[List[KeyValueItem]] = None
    redis_keys: Optional[List[KeyValueItem]] = None
    experiments: Optional[List[KeyValueItem]] = None


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    role: str = "editor"
    created_at: str = Field(default_factory=now_iso)


class UserRoleUpdate(BaseModel):
    role: str


class LoginIn(BaseModel):
    email: str
    password: str


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str = ""


class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None


# ============================================================
# Auth helpers
# ============================================================
async def get_current_user(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)



def require_role(min_role: str):
    async def check(request: Request) -> User:
        user = await get_current_user(request)
        if ROLE_HIERARCHY.get(user.role, -1) < ROLE_HIERARCHY.get(min_role, 999):
            raise HTTPException(
                status_code=403,
                detail={"error": {"code": "FORBIDDEN", "message": "Insufficient permissions"}},
            )
        return user
    return check


async def _create_session(user_id: str, response: Response) -> str:
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now_iso(),
    })
    response.set_cookie(
        key="session_token", value=session_token,
        max_age=7 * 24 * 60 * 60, httponly=True, secure=False, samesite="lax", path="/",
    )
    return session_token


@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    name = payload.name or payload.email.split("@")[0]
    await db.users.insert_one({
        "user_id": user_id,
        "email": payload.email,
        "name": name,
        "picture": "",
        "role": "editor",
        "password_hash": bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode(),
        "created_at": now_iso(),
    })
    await _create_session(user_id, response)
    return {"user_id": user_id, "email": payload.email, "name": name, "picture": "", "role": "editor"}


@api_router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    user_doc = await db.users.find_one({"email": payload.email}, {"_id": 0})
    logger.info("login attempt email=%r found=%s", payload.email, bool(user_doc))
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    stored = user_doc.get("password_hash", "")
    logger.info("stored hash present=%s len=%d", bool(stored), len(stored))
    try:
        match = bcrypt.checkpw(payload.password.encode(), stored.encode())
    except Exception as ex:
        logger.exception("bcrypt.checkpw error: %s", ex)
        raise HTTPException(status_code=500, detail="Auth error")
    logger.info("bcrypt match=%s", match)
    if not match:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await _create_session(user_doc["user_id"], response)
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture", ""),
        "role": user_doc.get("role", "editor"),
    }


@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user.model_dump()


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", httponly=True, samesite="lax")
    return {"ok": True}


# ============================================================
# Features endpoints
# ============================================================
@api_router.get("/features")
async def list_features(request: Request, q: Optional[str] = None, tag: Optional[str] = None, owner: Optional[str] = None):
    await get_current_user(request)
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    if tag:
        query["tags"] = tag
    if owner:
        query["owner"] = owner
    docs = await db.features.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return docs


@api_router.get("/features/{feature_id}")
async def get_feature(feature_id: str, request: Request):
    await get_current_user(request)
    doc = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Feature not found")
    return doc


@api_router.post("/features")
async def create_feature(payload: FeatureCreate, request: Request):
    user = await require_role("editor")(request)
    feature = Feature(
        **payload.model_dump(),
        created_by=user.email,
        contributors=[user.email],
    )
    doc = feature.model_dump()
    await db.features.insert_one(doc)
    await log_activity(user, "created", feature.id, feature.name)
    doc.pop("_id", None)
    return doc


@api_router.put("/features/{feature_id}")
async def update_feature(feature_id: str, payload: FeatureUpdate, request: Request):
    user = await require_role("editor")(request)
    existing = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    for key in ["apis", "mongo_collections", "redis_keys", "experiments"]:
        if key in updates:
            updates[key] = [item if isinstance(item, dict) else item.model_dump() for item in updates[key]]

    updates["updated_at"] = now_iso()
    contributors = set(existing.get("contributors", []))
    contributors.add(user.email)
    updates["contributors"] = list(contributors)

    await db.features.update_one({"id": feature_id}, {"$set": updates})
    await log_activity(user, "updated", feature_id, updates.get("name", existing["name"]))
    doc = await db.features.find_one({"id": feature_id}, {"_id": 0})
    return doc


@api_router.delete("/features/{feature_id}")
async def delete_feature(feature_id: str, request: Request):
    user = await require_role("editor")(request)
    existing = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature not found")
    await db.features.delete_one({"id": feature_id})
    await log_activity(user, "deleted", feature_id, existing["name"])
    return {"ok": True}


# ============================================================
# CSV / Excel import
# ============================================================
@api_router.post("/features/import")
async def import_features(request: Request, file: UploadFile = File(...)):
    user = await require_role("editor")(request)
    contents = await file.read()
    filename = (file.filename or "").lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only .csv, .xlsx, .xls supported")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")

    df.columns = [c.strip().lower() for c in df.columns]
    imported = 0
    errors = []
    for idx, row in df.iterrows():
        try:
            name = str(row.get("name", "")).strip()
            if not name or name.lower() == "nan":
                continue

            def parse_list(v):
                if v is None or (isinstance(v, float) and pd.isna(v)):
                    return []
                s = str(v).strip()
                if not s:
                    return []
                try:
                    j = json.loads(s)
                    if isinstance(j, list):
                        return j
                except Exception:
                    pass
                return [item.strip() for item in s.split(",") if item.strip()]

            def parse_kv_list(v):
                if v is None or (isinstance(v, float) and pd.isna(v)):
                    return []
                s = str(v).strip()
                if not s:
                    return []
                try:
                    j = json.loads(s)
                    if isinstance(j, list):
                        return [{"key": (item.get("key") if isinstance(item, dict) else str(item)), "description": item.get("description", "") if isinstance(item, dict) else ""} for item in j]
                except Exception:
                    pass
                return [{"key": item.strip(), "description": ""} for item in s.split("\n") if item.strip()]

            def parse_apis(v):
                if v is None or (isinstance(v, float) and pd.isna(v)):
                    return []
                s = str(v).strip()
                if not s:
                    return []
                try:
                    j = json.loads(s)
                    if isinstance(j, list):
                        return j
                except Exception:
                    pass
                out = []
                for line in s.split("\n"):
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split(None, 1)
                    if len(parts) == 2:
                        out.append({"method": parts[0].upper(), "path": parts[1], "description": "", "sample_request": "", "sample_response": ""})
                    else:
                        out.append({"method": "GET", "path": line, "description": "", "sample_request": "", "sample_response": ""})
                return out

            def sval(k):
                v = row.get(k, "")
                if v is None or (isinstance(v, float) and pd.isna(v)):
                    return ""
                return str(v)

            feature = Feature(
                name=name,
                description=sval("description"),
                owner=sval("owner"),
                tags=parse_list(row.get("tags")),
                test_data=sval("test_data"),
                test_steps=sval("test_steps"),
                mocking_steps=sval("mocking_steps"),
                apis=parse_apis(row.get("apis")),
                mongo_collections=parse_kv_list(row.get("mongo_collections")),
                redis_keys=parse_kv_list(row.get("redis_keys")),
                experiments=parse_kv_list(row.get("experiments")),
                created_by=user.email,
                contributors=[user.email],
            )
            await db.features.insert_one(feature.model_dump())
            imported += 1
        except Exception as e:
            errors.append(f"Row {idx}: {e}")

    await log_activity(user, "imported", "", f"{imported} features")
    return {"imported": imported, "errors": errors}


# ============================================================
# Activity log
# ============================================================
async def log_activity(user: User, action: str, feature_id: str, feature_name: str):
    await db.activity.insert_one({
        "id": f"act_{uuid.uuid4().hex[:12]}",
        "user_email": user.email,
        "user_name": user.name,
        "action": action,
        "feature_id": feature_id,
        "feature_name": feature_name,
        "timestamp": now_iso(),
    })


@api_router.get("/activity")
async def get_activity(request: Request, limit: int = 30):
    await get_current_user(request)
    docs = await db.activity.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return docs


@api_router.get("/stats")
async def get_stats(request: Request):
    await get_current_user(request)
    total_features = await db.features.count_documents({})
    contributors = await db.features.distinct("contributors")
    all_tags = await db.features.distinct("tags")
    recent = await db.activity.find({}, {"_id": 0}).sort("timestamp", -1).to_list(5)
    return {
        "total_features": total_features,
        "total_contributors": len([c for c in contributors if c]),
        "total_tags": len([t for t in all_tags if t]),
        "recent_activity": recent,
    }


# ============================================================
# AI Chat Agent (Anthropic SDK — Claude Sonnet 4.5)
# ============================================================
def build_knowledge_context(features: List[Dict[str, Any]]) -> str:
    lines = []
    for f in features:
        lines.append(f"### Feature: {f.get('name','')} (id={f.get('id','')})")
        if f.get("description"):
            lines.append(f"Description: {f['description']}")
        if f.get("owner"):
            lines.append(f"Owner: {f['owner']}")
        if f.get("tags"):
            lines.append(f"Tags: {', '.join(f['tags'])}")
        if f.get("test_data"):
            lines.append(f"Test Data:\n{f['test_data']}")
        if f.get("test_steps"):
            lines.append(f"Test Steps:\n{f['test_steps']}")
        if f.get("mocking_steps"):
            lines.append(f"Mocking Steps:\n{f['mocking_steps']}")
        if f.get("apis"):
            api_lines = [f"  - {a.get('method','GET')} {a.get('path','')} — {a.get('description','')}" for a in f["apis"]]
            lines.append("APIs:\n" + "\n".join(api_lines))
        if f.get("mongo_collections"):
            lines.append("MongoDB: " + ", ".join([m.get("key", "") for m in f["mongo_collections"]]))
        if f.get("redis_keys"):
            lines.append("Redis: " + ", ".join([r.get("key", "") for r in f["redis_keys"]]))
        if f.get("experiments"):
            lines.append("Experiments: " + ", ".join([e.get("key", "") for e in f["experiments"]]))
        lines.append("")
    return "\n".join(lines)


@api_router.post("/chat")
async def chat(payload: ChatMessageIn, request: Request):
    user = await get_current_user(request)
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    features = await db.features.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    kb = build_knowledge_context(features)

    system_message = (
        "You are the QA Knowledge Assistant for an engineering team. "
        "Answer questions about features, test data, test steps, mocking steps, "
        "APIs, MongoDB collections, Redis keys, and experiments using ONLY the knowledge base below. "
        "If the answer is not in the knowledge base, say so clearly and suggest the user add the info. "
        "Be concise, use markdown lists / code fences for endpoints, keys and steps.\n\n"
        "=== KNOWLEDGE BASE ===\n"
        f"{kb if kb.strip() else '(empty — no features yet)'}\n"
        "=== END KNOWLEDGE BASE ==="
    )

    # Fetch previous messages for this session from DB
    session_id = payload.session_id or f"chat_{uuid.uuid4().hex[:8]}"
    history_docs = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(50)

    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    messages = []
    for doc in history_docs:
        if doc.get("content", "").strip():
            messages.append({"role": doc["role"], "content": doc["content"]})
    messages.append({"role": "user", "content": payload.message})

    await db.chat_messages.insert_one({
        "id": f"msg_{uuid.uuid4().hex[:12]}",
        "session_id": session_id,
        "user_email": user.email,
        "role": "user",
        "content": payload.message,
        "timestamp": now_iso(),
    })

    async def event_stream():
        ac = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        full = []
        try:
            async with ac.messages.stream(
                model="claude-haiku-4-5",
                max_tokens=2048,
                system=system_message,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    full.append(text)
                    yield f"data: {json.dumps({'delta': text})}\n\n"
        except Exception as e:
            logger.exception("chat error")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        await db.chat_messages.insert_one({
            "id": f"msg_{uuid.uuid4().hex[:12]}",
            "session_id": session_id,
            "user_email": user.email,
            "role": "assistant",
            "content": "".join(full),
            "timestamp": now_iso(),
        })
        yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str, request: Request):
    await get_current_user(request)
    docs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return docs


# ============================================================
# User management (admin only)
# ============================================================
@api_router.get("/users")
async def list_users(request: Request):
    await require_role("admin")(request)
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return docs


@api_router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, payload: UserRoleUpdate, request: Request):
    actor = await require_role("admin")(request)
    if payload.role not in ROLE_HIERARCHY:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_ROLE", "message": f"Role must be one of: {list(ROLE_HIERARCHY.keys())}"}},
        )
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    old_role = target.get("role", "editor")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": payload.role}})
    await db.activity.insert_one({
        "id": f"act_{uuid.uuid4().hex[:12]}",
        "user_email": actor.email,
        "user_name": actor.name,
        "action": "role_changed",
        "target_user_id": user_id,
        "target_email": target["email"],
        "old_role": old_role,
        "new_role": payload.role,
        "timestamp": now_iso(),
    })
    return {"ok": True, "user_id": user_id, "role": payload.role}


# ============================================================
# App wiring
# ============================================================
@api_router.get("/")
async def root():
    return {"message": "Test Knowledge Hub API"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
