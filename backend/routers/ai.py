import json
import uuid
import logging
import anthropic
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
from database import db, ANTHROPIC_API_KEY
from models import ChatMessageIn, now_iso
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


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
            api_lines = [f"  - {a.get('curl','').splitlines()[0] if a.get('curl') else ''} — {a.get('description','')}" for a in f["apis"]]
            lines.append("APIs:\n" + "\n".join(api_lines))
        if f.get("mongo_collections"):
            lines.append("MongoDB: " + ", ".join([m.get("key", "") for m in f["mongo_collections"]]))
        if f.get("redis_keys"):
            lines.append("Redis: " + ", ".join([r.get("key", "") for r in f["redis_keys"]]))
        if f.get("experiments"):
            lines.append("Experiments: " + ", ".join([e.get("key", "") for e in f["experiments"]]))
        lines.append("")
    return "\n".join(lines)


@router.post("/chat")
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

    session_id = payload.session_id or f"chat_{uuid.uuid4().hex[:8]}"
    history_docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
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


@router.get("/chat/history/{session_id}")
async def chat_history(session_id: str, request: Request):
    await get_current_user(request)
    docs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return docs
