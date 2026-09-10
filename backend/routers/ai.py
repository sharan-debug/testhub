import json
import uuid
import logging
import anthropic
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
from database import db, ANTHROPIC_API_KEY
from models import ChatMessageIn, AIFeedbackIn, now_iso
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
        "=== TESTHUB QA ACTIONS (IMPORTANT) ===\n"
        "TestHub has a built-in QA Actions page (navigate to /qa in the sidebar) that connects "
        "directly to the QA utility. NEVER tell users to use curl, Postman, or external tools — "
        "always direct them to TestHub's QA Actions page instead.\n\n"
        "The /qa page has four tabs:\n"
        "1. EXPERIMENTS tab — type any experiment/flag name, click 'Get state' to see current "
        "variant distribution, edit weights and click 'Apply weights', or click 'Reset to previous'. "
        "Use this to check or change any experiment (e.g. feature-withdrawal-video-eligibility-exp).\n"
        "2. REDIS tab — type any Redis key, click 'Read' to see current value, 'Set' to store a "
        "new value with TTL, or 'Delete' to remove the key.\n"
        "3. WITHDRAWAL MOCK tab — enter phone number, provider (AXIS/ICICI), status "
        "(SUCCESS/PENDING/FAILED), optional status code and amount. Click 'Set Mock' to apply. "
        "Use this to mock withdrawal API responses for a specific phone number.\n"
        "4. MOCK VPA tab — enter phone number, encrypted VPA string, user name, and VPA type. "
        "Click 'Set VPA Mock' to set up a KYC VPA mock for testing.\n\n"
        "Additionally, every feature detail page has a collapsible 'QA Actions' panel at the bottom "
        "that pre-fills experiments and Redis keys from that feature's data — useful for quick "
        "feature-specific mocking without typing the names manually.\n\n"
        "When a user asks:\n"
        "- 'Can you check if an API is accessible?' → Direct them to the relevant tab on /qa.\n"
        "- 'How do I mock withdrawal?' → Tell them: go to /qa → Withdrawal Mock tab, fill the form.\n"
        "- 'How do I mock VPA / KYC?' → Tell them: go to /qa → Mock VPA tab, fill the form.\n"
        "- 'How do I set an experiment?' → Tell them: go to /qa → Experiments tab, enter the name.\n"
        "- 'What's the current value of a Redis key?' → Tell them: go to /qa → Redis tab, enter the key.\n"
        "=== END TESTHUB QA ACTIONS ===\n\n"
        "=== KNOWLEDGE BASE ===\n"
        f"{kb if kb.strip() else '(empty — no features yet)'}\n"
        "=== END KNOWLEDGE BASE ==="
    )

    session_id = payload.session_id or f"chat_{uuid.uuid4().hex[:8]}"

    # Tie chat message lifetime to the user's auth session so MongoDB auto-deletes them on expiry.
    token = request.cookies.get("session_token")
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0, "expires_at": 1})
    if session_doc:
        chat_expires_at = session_doc["expires_at"]
        if isinstance(chat_expires_at, str):
            chat_expires_at = datetime.fromisoformat(chat_expires_at)
        if chat_expires_at.tzinfo is None:
            chat_expires_at = chat_expires_at.replace(tzinfo=timezone.utc)
    else:
        chat_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

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
        "expires_at": chat_expires_at,
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

        response_text = "".join(full)
        response_lower = response_text.lower()
        sources = [
            {"id": f["id"], "name": f["name"]}
            for f in features
            if f.get("name") and f["name"].lower() in response_lower
        ][:6]

        await db.chat_messages.insert_one({
            "id": f"msg_{uuid.uuid4().hex[:12]}",
            "session_id": session_id,
            "user_email": user.email,
            "role": "assistant",
            "content": response_text,
            "sources": sources,
            "timestamp": now_iso(),
            "expires_at": chat_expires_at,
        })
        yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'sources': sources})}\n\n"

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


@router.post("/ai/feedback")
async def submit_feedback(payload: AIFeedbackIn, request: Request):
    user = await get_current_user(request)
    if not payload.feedback.strip():
        raise HTTPException(status_code=400, detail="Feedback cannot be empty")
    await db.ai_feedback.insert_one({
        "id": f"fb_{uuid.uuid4().hex[:12]}",
        "session_id": payload.session_id,
        "ai_message": payload.ai_message[:2000],
        "feedback": payload.feedback.strip()[:1000],
        "feature_ids": payload.feature_ids,
        "user_email": user.email,
        "timestamp": now_iso(),
    })
    return {"status": "ok"}
