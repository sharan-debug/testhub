import io
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from typing import Optional, Dict, Any
from database import db
from models import Feature, FeatureCreate, FeatureUpdate, now_iso
from dependencies import get_current_user, require_role, log_activity

router = APIRouter(prefix="/api/features")


async def _validate_core_feature_id(core_feature_id: str):
    if not core_feature_id or not core_feature_id.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_CORE_FEATURE", "message": "core_feature_id is required"}},
        )
    cf = await db.core_features.find_one({"id": core_feature_id, "status": "active"})
    if not cf:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_CORE_FEATURE", "message": "core_feature_id does not match an active core feature"}},
        )


@router.post("/import")
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
                        return [{"curl": item.get("curl", ""), "description": item.get("description", "")} if isinstance(item, dict) else {"curl": str(item), "description": ""} for item in j]
                except Exception:
                    pass
                return [{"curl": line.strip(), "description": ""} for line in s.split("\n") if line.strip()]

            def sval(k):
                v = row.get(k, "")
                if v is None or (isinstance(v, float) and pd.isna(v)):
                    return ""
                return str(v)

            feature = Feature(
                name=name,
                description=sval("description"),
                owner=user.name,
                tags=parse_list(row.get("tags")),
                jira_ticket=sval("jira_ticket"),
                status="active",
                test_data=sval("test_data"),
                test_steps=sval("test_steps"),
                mocking_steps=sval("mocking_steps"),
                apis=parse_apis(row.get("apis")),
                mongo_collections=parse_kv_list(row.get("mongo_collections")),
                redis_keys=parse_kv_list(row.get("redis_keys")),
                experiments=parse_kv_list(row.get("experiments")),
                created_by=user.email,
                updated_by=user.name,
                contributors=[user.email],
            )
            await db.features.insert_one(feature.model_dump())
            imported += 1
        except Exception as e:
            errors.append(f"Row {idx}: {e}")

    await log_activity(user, "imported", "", f"{imported} features")
    return {"imported": imported, "errors": errors}


@router.get("")
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


@router.get("/{feature_id}")
async def get_feature(feature_id: str, request: Request):
    await get_current_user(request)
    doc = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Feature not found")
    return doc


@router.post("")
async def create_feature(payload: FeatureCreate, request: Request):
    user = await require_role("editor")(request)
    await _validate_core_feature_id(payload.core_feature_id)
    feature = Feature(
        **payload.model_dump(),
        owner=user.name,
        created_by=user.email,
        updated_by=user.name,
        contributors=[user.email],
    )
    doc = feature.model_dump()
    await db.features.insert_one(doc)
    await log_activity(user, "created", feature.id, feature.name)
    doc.pop("_id", None)
    return doc


@router.put("/{feature_id}")
async def update_feature(feature_id: str, payload: FeatureUpdate, request: Request):
    user = await require_role("editor")(request)
    existing = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature not found")

    if payload.core_feature_id is not None:
        await _validate_core_feature_id(payload.core_feature_id)

    if payload.status is not None and payload.status not in ("active", "archived"):
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_STATUS", "message": "status must be 'active' or 'archived'"}},
        )

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    for key in ["apis", "mongo_collections", "redis_keys", "experiments"]:
        if key in updates:
            updates[key] = [item if isinstance(item, dict) else item.model_dump() for item in updates[key]]

    updates["updated_at"] = now_iso()
    updates["updated_by"] = user.name
    contributors = set(existing.get("contributors", []))
    contributors.add(user.email)
    updates["contributors"] = list(contributors)

    await db.features.update_one({"id": feature_id}, {"$set": updates})
    await log_activity(user, "updated", feature_id, updates.get("name", existing["name"]))
    doc = await db.features.find_one({"id": feature_id}, {"_id": 0})
    return doc


@router.delete("/{feature_id}")
async def delete_feature(feature_id: str, request: Request):
    user = await require_role("editor")(request)
    existing = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature not found")
    await db.features.delete_one({"id": feature_id})
    await log_activity(user, "deleted", feature_id, existing["name"])
    return {"ok": True}


@router.post("/{feature_id}/verify")
async def verify_feature(feature_id: str, request: Request):
    user = await get_current_user(request)
    existing = await db.features.find_one({"id": feature_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature not found")
    now = now_iso()
    await db.features.update_one(
        {"id": feature_id},
        {"$set": {"last_verified_at": now, "last_verified_by": user.email}},
    )
    await log_activity(user, "verified", feature_id, existing["name"])
    doc = await db.features.find_one({"id": feature_id}, {"_id": 0})
    return doc
