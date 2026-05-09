from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.database import engine, get_db
from app.models import Base
from app.auth import decode_access_token
from app.routers import auth, students, lessons, payments, group_classes, schedule, statistics, backup, export
from app.services.backup import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    yield


app = FastAPI(title="钢琴课时管理", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(group_classes.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(export.router, prefix="/api")
