import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

import database  # loads .env and creates the DB connection before any router imports
from database import CORS_ORIGINS, shutdown_db, ensure_indexes
from routers import auth, core_features, features, activity, ai, users

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

_MAX_BODY_BYTES = 10 * 1024 * 1024  # 10 MB

app = FastAPI(title="Test Knowledge Hub")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Request body too large (max 10 MB)"})
    return await call_next(request)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(auth.router)
app.include_router(core_features.router)
app.include_router(features.router)
app.include_router(activity.router)
app.include_router(ai.router)
app.include_router(users.router)


@app.get("/api/")
async def root():
    return {"message": "Test Knowledge Hub API"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/ready")
async def ready():
    try:
        await database.db.command("ping")
        return {"status": "ready"}
    except Exception:
        logger.exception("Readiness check failed")
        return JSONResponse(status_code=503, content={"status": "unavailable"})


@app.on_event("startup")
async def startup():
    await ensure_indexes()


@app.on_event("shutdown")
async def shutdown_db_client():
    shutdown_db()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
