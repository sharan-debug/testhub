import uuid
import logging
from fastapi import HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
from database import db
from models import User, now_iso

logger = logging.getLogger(__name__)

ROLE_HIERARCHY = {"viewer": 0, "editor": 1, "approver": 2, "admin": 3}


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
