import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

import database  # loads .env and creates the DB connection before any router imports
from database import CORS_ORIGINS, shutdown_db, ensure_indexes
from routers import auth, core_features, features, activity, ai, users

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = FastAPI(title="Test Knowledge Hub")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(core_features.router)
app.include_router(features.router)
app.include_router(activity.router)
app.include_router(ai.router)
app.include_router(users.router)


@app.get("/api/")
async def root():
    return {"message": "Test Knowledge Hub API"}


@app.on_event("startup")
async def startup():
    await ensure_indexes()


@app.on_event("shutdown")
async def shutdown_db_client():
    shutdown_db()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
