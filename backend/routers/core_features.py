import uuid
from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any
from database import db
from models import CoreFeature, CoreFeatureCreate, CoreFeatureUpdate, now_iso
from dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/core-features")


@router.get("")
async def list_core_features(request: Request):
    await get_current_user(request)
    docs = await db.core_features.find({"status": "active"}, {"_id": 0}).sort("name", 1).to_list(1000)
    return docs


@router.post("")
async def create_core_feature(payload: CoreFeatureCreate, request: Request):
    user = await require_role("admin")(request)
    existing = await db.core_features.find_one(
        {"name": {"$regex": f"^{payload.name.strip()}$", "$options": "i"}, "status": "active"}
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "DUPLICATE_CORE_FEATURE", "message": "A core feature with this name already exists"}},
        )
    cf = CoreFeature(
        name=payload.name.strip(),
        description=payload.description,
        created_by=user.email,
    )
    doc = cf.model_dump()
    await db.core_features.insert_one(doc)
    await db.activity.insert_one({
        "id": f"act_{uuid.uuid4().hex[:12]}",
        "user_email": user.email,
        "user_name": user.name,
        "action": "core_feature_created",
        "feature_id": cf.id,
        "feature_name": cf.name,
        "timestamp": now_iso(),
    })
    doc.pop("_id", None)
    return doc


@router.put("/{cf_id}")
async def update_core_feature(cf_id: str, payload: CoreFeatureUpdate, request: Request):
    user = await require_role("admin")(request)
    existing = await db.core_features.find_one({"id": cf_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Core feature not found")
    updates: Dict[str, Any] = {}
    if payload.name is not None:
        updates["name"] = payload.name.strip()
    if payload.description is not None:
        updates["description"] = payload.description
    updates["updated_at"] = now_iso()
    await db.core_features.update_one({"id": cf_id}, {"$set": updates})
    await db.activity.insert_one({
        "id": f"act_{uuid.uuid4().hex[:12]}",
        "user_email": user.email,
        "user_name": user.name,
        "action": "core_feature_updated",
        "feature_id": cf_id,
        "feature_name": updates.get("name", existing["name"]),
        "timestamp": now_iso(),
    })
    doc = await db.core_features.find_one({"id": cf_id}, {"_id": 0})
    return doc
