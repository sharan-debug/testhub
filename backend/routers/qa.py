import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import QA_UTILITY_URL, QA_UTILITY_USERNAME, QA_UTILITY_PASSWORD
from dependencies import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/qa")

_token_cache: dict = {"value": None, "expires_at": None}


def _configured() -> bool:
    return bool(QA_UTILITY_URL and QA_UTILITY_USERNAME and QA_UTILITY_PASSWORD)


async def _get_token() -> str:
    now = datetime.now(timezone.utc)
    if _token_cache["value"] and _token_cache["expires_at"] and now < _token_cache["expires_at"]:
        return _token_cache["value"]
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{QA_UTILITY_URL}/auth/token",
            json={"username": QA_UTILITY_USERNAME, "password": QA_UTILITY_PASSWORD},
        )
        if not r.is_success:
            raise HTTPException(status_code=502, detail="QA utility authentication failed")
        data = r.json()
        _token_cache["value"] = data["token"]
        _token_cache["expires_at"] = now + timedelta(hours=23)
        return _token_cache["value"]


def _reset_token():
    _token_cache["value"] = None
    _token_cache["expires_at"] = None


async def _qa(method: str, path: str, *, params: dict = None, body: dict = None) -> dict:
    token = await _get_token()
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(
            method,
            f"{QA_UTILITY_URL}{path}",
            params=params,
            json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
    if r.status_code == 401:
        _reset_token()
        raise HTTPException(status_code=502, detail="QA utility: token rejected")
    if not r.is_success:
        detail = r.text[:400] if r.text else "Unknown error"
        raise HTTPException(status_code=502, detail=f"QA utility error: {detail}")
    return r.json() if r.text.strip() else {}


# ---------- Status ----------

@router.get("/status")
async def qa_status(request: Request):
    await get_current_user(request)
    return {"configured": _configured()}


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
    await get_current_user(request)
    if not _configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    return await _qa("GET", "/v1/api/experiment", params={"experimentName": name})


@router.put("/experiment")
async def set_experiment(payload: ExperimentUpdate, request: Request):
    user = await require_role("editor")(request)
    if not _configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    total = sum(v.weight for v in payload.variants)
    if total != 100:
        raise HTTPException(status_code=400, detail=f"Variant weights must sum to 100 (got {total})")
    body = {
        "experimentName": payload.name,
        "variants": [{"name": v.name, "weight": v.weight} for v in payload.variants],
    }
    result = await _qa("PUT", "/v1/api/experiment", body=body)
    logger.info("QA: %s set experiment '%s' variants=%s", user.email, payload.name, payload.variants)
    return result


@router.post("/experiment/reset")
async def reset_experiment(payload: ExperimentReset, request: Request):
    user = await require_role("editor")(request)
    if not _configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    result = await _qa("POST", "/v1/api/experiment/reset", params={"experimentName": payload.name})
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
    await get_current_user(request)
    if not _configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    return await _qa("GET", "/v1/api/redis", params={"key": key})


@router.post("/redis")
async def set_redis(payload: RedisSet, request: Request):
    user = await require_role("editor")(request)
    if not _configured():
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
    # Try update first; if 404, create.
    token = await _get_token()
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
            _reset_token()
            raise HTTPException(status_code=502, detail="QA utility: token rejected")
        if not r.is_success:
            raise HTTPException(status_code=502, detail=f"QA utility error: {r.text[:400]}")
    logger.info("QA: %s set redis key '%s'", user.email, payload.key)
    return {"status": "ok"}


@router.delete("/redis")
async def delete_redis(key: str, request: Request):
    user = await require_role("editor")(request)
    if not _configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    result = await _qa("DELETE", "/v1/api/redis", params={"key": key})
    logger.info("QA: %s deleted redis key '%s'", user.email, key)
    return result


# ---------- Withdrawal Mock ----------

class WithdrawalMock(BaseModel):
    phone_number: str
    provider: str
    status: str
    status_code: Optional[int] = None
    amount: Optional[float] = None


@router.post("/mock/withdrawal")
async def set_withdrawal_mock(payload: WithdrawalMock, request: Request):
    user = await require_role("editor")(request)
    if not _configured():
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
    result = await _qa("PUT", "/v1/api/withdrawal-mock", body=body)
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
    if not _configured():
        raise HTTPException(status_code=503, detail="QA utility not configured")
    body = {
        "phoneNumber": payload.phone_number,
        "encryptedVpa": payload.encrypted_vpa,
        "userName": payload.user_name,
        "vpaType": payload.vpa_type,
    }
    result = await _qa("POST", "/v1/api/mock-vpa/setup", body=body)
    logger.info(
        "QA: %s set VPA mock phone=%s vpaType=%s",
        user.email, payload.phone_number, payload.vpa_type,
    )
    return result
