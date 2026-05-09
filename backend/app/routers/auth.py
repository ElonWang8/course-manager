from __future__ import annotations
from fastapi import APIRouter
from app.auth import verify_password, create_access_token, get_token_expiration
from app.schemas import LoginRequest, LoginResponse

router = APIRouter(tags=["认证"])


@router.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if not verify_password(body.password):
        return LoginResponse(token="", expires_at=get_token_expiration(False))

    token = create_access_token(remember=body.remember)
    expires_at = get_token_expiration(remember=body.remember)
    return LoginResponse(token=token, expires_at=expires_at)
