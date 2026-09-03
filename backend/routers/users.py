import uuid
from fastapi import APIRouter, HTTPException, Request
from database import db
from models import UserRoleUpdate, now_iso
from dependencies import require_role, ROLE_HIERARCHY

router = APIRouter(prefix="/api/users")


@router.get("")
async def list_users(request: Request):
    await require_role("admin")(request)
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return docs


@router.patch("/{user_id}/role")
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
