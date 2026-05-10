from __future__ import annotations
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from jose import JWTError

from app.database import engine
from app.models import Base
from app.auth import decode_access_token
from app.routers import auth, students, lessons, payments, group_classes, schedule, statistics, backup, export
from app.services.backup import start_scheduler

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    yield


app = FastAPI(title="钢琴课时管理", lifespan=lifespan)

EXCLUDED_PATHS = {"/api/auth/login", "/docs", "/openapi.json", "/redoc"}


@app.middleware("http")
async def jwt_middleware(request: Request, call_next):
    if request.url.path in EXCLUDED_PATHS or not request.url.path.startswith("/api"):
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "未登录"})

    try:
        token = auth_header.split(" ", 1)[1]
        decode_access_token(token)
    except JWTError:
        return JSONResponse(status_code=401, content={"detail": "登录已过期，请重新登录"})

    return await call_next(request)


# API routes
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(group_classes.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(export.router, prefix="/api")

# Serve static frontend files (only in Docker/production)
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_spa(full_path: str):
        """Serve index.html for all non-API routes (SPA fallback)."""
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        return HTMLResponse("<h1>Frontend not built</h1>", status_code=404)
