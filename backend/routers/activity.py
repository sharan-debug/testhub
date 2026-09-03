from fastapi import APIRouter, Request
from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/api")


@router.get("/activity")
async def get_activity(request: Request, limit: int = 30):
    await get_current_user(request)
    docs = await db.activity.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return docs


@router.get("/stats")
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
