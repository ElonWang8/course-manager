from __future__ import annotations
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import ADMIN_PASSWORD, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, JWT_EXPIRATION_HOURS_REMEMBER

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_password_hash: str | None = None


def get_password_hash() -> str:
    global _password_hash
    if _password_hash is None:
        _password_hash = pwd_context.hash(ADMIN_PASSWORD)
    return _password_hash


def verify_password(password: str) -> bool:
    return pwd_context.verify(password, get_password_hash())


def create_access_token(remember: bool = False) -> str:
    expire_hours = JWT_EXPIRATION_HOURS_REMEMBER if remember else JWT_EXPIRATION_HOURS
    expire = datetime.now(timezone.utc) + timedelta(hours=expire_hours)
    return jwt.encode({"sub": "admin", "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def get_token_expiration(remember: bool = False) -> datetime:
    expire_hours = JWT_EXPIRATION_HOURS_REMEMBER if remember else JWT_EXPIRATION_HOURS
    return datetime.now(timezone.utc) + timedelta(hours=expire_hours)
