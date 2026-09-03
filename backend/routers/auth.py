import uuid
import logging
import bcrypt
from fastapi import APIRouter, HTTPException, Request, Response
from database import db
from models import LoginIn, RegisterIn, now_iso
from dependencies import get_current_user, _create_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth")


@router.post("/register")
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


@router.post("/login")
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


@router.get("/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user.model_dump()


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", httponly=True, samesite="lax")
    return {"ok": True}
