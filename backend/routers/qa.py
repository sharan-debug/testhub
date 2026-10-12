import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import QA_UTILITY_URL, QA_UTILITY_USERNAME, QA_UTILITY_PASSWORD, db
from dependencies import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/qa")

_global_token_cache: dict = {"value": None, "expires_at": None}


def _url_configured() -> bool:
    return bool(QA_UTILITY_URL)


def _has_global_creds() -> bool:
    return bool(QA_UTILITY_USERNAME and QA_UTILITY_PASSWORD)


async def _get_global_token() -> str:
    now = datetime.now(timezone.utc)
    if _global_token_cache["value"] and _global_token_cache["expires_at"] and now < _global_token_cache["expires_at"]:
        return _global_token_cache["value"]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{QA_UTILITY_URL}/auth/token",
                json={"username": QA_UTILITY_USERNAME, "password": QA_UTILITY_PASSWORD},
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="QA utility timed out. Check your VPN connection.")
    if not r.is_success:
        raise HTTPException(status_code=502, detail="QA utility authentication failed")
    data = r.json()
    _global_token_cache["value"] = data["token"]
    _global_token_cache["expires_at"] = now + timedelta(hours=23)
    return _global_token_cache["value"]


def _reset_global_token():
    _global_token_cache["value"] = None
    _global_token_cache["expires_at"] = None


async def _get_effective_token(user_id: str) -> tuple[str, bool]:
    """Returns (token, is_user_token). Per-user stored token takes priority; falls back to global env creds."""
    now = datetime.now(timezone.utc)
    user_doc = await db.qa_user_tokens.find_one({"user_id": user_id})
    if user_doc and user_doc.get("token"):
        expires_raw = user_doc.get("expires_at")
        if expires_raw is None or datetime.fromisoformat(expires_raw) > now:
            return user_doc["token"], True
    if _has_global_creds():
        return await _get_global_token(), False
    raise HTTPException(
        status_code=503,
        detail="QA utility: not connected. Use 'Connect to QA Utility' in the QA Actions panel.",
    )


async def _qa(method: str, path: str, *, user_id: str, params: dict = None, body: dict = None) -> dict:
    token, is_user_token = await _get_effective_token(user_id)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.request(
                method,
                f"{QA_UTILITY_URL}{path}",
                params=params,
                json=body,
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="QA utility timed out. Check your VPN connection.")
    if r.status_code == 401:
        if is_user_token:
            await db.qa_user_tokens.delete_one({"user_id": user_id})
        else:
            _reset_global_token()
        raise HTTPException(status_code=502, detail="QA utility: session expired. Please reconnect.")
    if not r.is_success:
        detail = r.text[:400] if r.text else "Unknown error"
        raise HTTPException(status_code=502, detail=f"QA utility error: {detail}")
    return r.json() if r.text.strip() else {}


class QaConnectIn(BaseModel):
    username: str
    password: str


# ---------- Status / Connection ----------

@router.get("/status")
async def qa_status(request: Request):
    """Legacy endpoint kept for backward compatibility."""
    await get_current_user(request)
    return {"configured": _url_configured() and _has_global_creds()}


@router.get("/user-status")
async def qa_user_status(request: Request):
    user = await get_current_user(request)
    url_configured = _url_configured()
    user_connected = False
    if url_configured:
        user_doc = await db.qa_user_tokens.find_one({"user_id": user.user_id})
        user_connected = bool(user_doc and user_doc.get("token"))
    connected = url_configured and (user_connected or _has_global_creds())
    return {"url_configured": url_configured, "user_connected": user_connected, "connected": connected}


@router.post("/connect")
async def qa_connect(payload: QaConnectIn, request: Request):
    user = await get_current_user(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility URL not configured")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{QA_UTILITY_URL}/auth/token",
                json={"username": payload.username, "password": payload.password},
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="QA utility timed out. Check your VPN connection.")
    if not r.is_success:
        raise HTTPException(status_code=401, detail="Invalid QA utility credentials")
    token = r.json().get("token")
    if not token:
        raise HTTPException(status_code=502, detail="QA utility did not return a token")
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=23)).isoformat()
    await db.qa_user_tokens.update_one(
        {"user_id": user.user_id},
        {"$set": {"user_id": user.user_id, "username": payload.username, "token": token, "expires_at": expires_at}},
        upsert=True,
    )
    logger.info("QA: %s connected with username=%s", user.email, payload.username)
    return {"ok": True}


@router.post("/disconnect")
async def qa_disconnect(request: Request):
    user = await get_current_user(request)
    await db.qa_user_tokens.delete_one({"user_id": user.user_id})
    logger.info("QA: %s disconnected", user.email)
    return {"ok": True}


# ---------- Experiments ----------

class ExperimentVariant(BaseModel):
    name: str
    weight: int


class ExperimentUpdate(BaseModel):
    name: str
    variants: List[ExperimentVariant]


class ExperimentReset(BaseModel):
    name: str


@router.get("/experiment")
async def get_experiment(name: str, request: Request):
    user = await get_current_user(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    return await _qa("GET", "/v1/api/experiment", user_id=user.user_id, params={"experimentName": name})


@router.put("/experiment")
async def set_experiment(payload: ExperimentUpdate, request: Request):
    user = await require_role("editor")(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    total = sum(v.weight for v in payload.variants)
    if total != 100:
        raise HTTPException(status_code=400, detail=f"Variant weights must sum to 100 (got {total})")
    body = {
        "experimentName": payload.name,
        "variants": [{"name": v.name, "weight": v.weight} for v in payload.variants],
    }
    result = await _qa("PUT", "/v1/api/experiment", user_id=user.user_id, body=body)
    logger.info("QA: %s set experiment '%s' variants=%s", user.email, payload.name, payload.variants)
    return result


@router.post("/experiment/reset")
async def reset_experiment(payload: ExperimentReset, request: Request):
    user = await require_role("editor")(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    result = await _qa("POST", "/v1/api/experiment/reset", user_id=user.user_id, params={"experimentName": payload.name})
    logger.info("QA: %s reset experiment '%s'", user.email, payload.name)
    return result


# ---------- Redis ----------

class RedisSet(BaseModel):
    key: str
    value: str
    ttl: int = 1
    ttl_unit: str = "HOUR"


@router.get("/redis")
async def get_redis(key: str, request: Request):
    user = await get_current_user(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    return await _qa("GET", "/v1/api/redis", user_id=user.user_id, params={"key": key})


@router.post("/redis")
async def set_redis(payload: RedisSet, request: Request):
    user = await require_role("editor")(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    ttl_units = {"DAY", "HOUR", "MINUTE", "SECOND"}
    if payload.ttl_unit.upper() not in ttl_units:
        raise HTTPException(status_code=400, detail=f"ttl_unit must be one of {ttl_units}")
    body = {
        "key": payload.key,
        "value": payload.value,
        "ttl": payload.ttl,
        "ttlUnit": payload.ttl_unit.upper(),
    }
    token, is_user_token = await _get_effective_token(user.user_id)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.put(
                f"{QA_UTILITY_URL}/v1/api/redis",
                json=body,
                headers={"Authorization": f"Bearer {token}"},
            )
            if r.status_code == 404:
                r = await client.post(
                    f"{QA_UTILITY_URL}/v1/api/redis",
                    json=body,
                    headers={"Authorization": f"Bearer {token}"},
                )
            if r.status_code == 401:
                if is_user_token:
                    await db.qa_user_tokens.delete_one({"user_id": user.user_id})
                else:
                    _reset_global_token()
                raise HTTPException(status_code=502, detail="QA utility: session expired. Please reconnect.")
            if not r.is_success:
                raise HTTPException(status_code=502, detail=f"QA utility error: {r.text[:400]}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="QA utility timed out. Check your VPN connection.")
    logger.info("QA: %s set redis key '%s'", user.email, payload.key)
    return {"status": "ok"}


@router.delete("/redis")
async def delete_redis(key: str, request: Request):
    user = await require_role("editor")(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    result = await _qa("DELETE", "/v1/api/redis", user_id=user.user_id, params={"key": key})
    logger.info("QA: %s deleted redis key '%s'", user.email, key)
    return result


# ---------- Withdrawal Mock ----------

class WithdrawalMock(BaseModel):
    phone_number: str
    provider: str
    status: str
    status_code: Optional[str] = None
    amount: Optional[float] = None


@router.post("/mock/withdrawal")
async def set_withdrawal_mock(payload: WithdrawalMock, request: Request):
    user = await require_role("editor")(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    body = {
        "phoneNumber": payload.phone_number,
        "provider": payload.provider.upper(),
        "status": payload.status.upper(),
    }
    if payload.status_code is not None:
        body["statusCode"] = payload.status_code
    if payload.amount is not None:
        body["amount"] = payload.amount
    result = await _qa("PUT", "/v1/api/withdrawal-mock", user_id=user.user_id, body=body)
    logger.info(
        "QA: %s set withdrawal mock phone=%s provider=%s status=%s",
        user.email, payload.phone_number, payload.provider, payload.status,
    )
    return result


# ---------- VPA Mock ----------

class VpaMock(BaseModel):
    phone_number: str
    encrypted_vpa: str
    user_name: str
    vpa_type: str


@router.post("/mock/vpa")
async def set_vpa_mock(payload: VpaMock, request: Request):
    user = await require_role("editor")(request)
    if not _url_configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    body = {
        "phoneNumber": payload.phone_number,
        "encryptedVpa": payload.encrypted_vpa,
        "userName": payload.user_name,
        "vpaType": payload.vpa_type,
    }
    result = await _qa("POST", "/v1/api/mock-vpa/setup", user_id=user.user_id, body=body)
    logger.info(
        "QA: %s set VPA mock phone=%s vpaType=%s",
        user.email, payload.phone_number, payload.vpa_type,
    )
    return result
