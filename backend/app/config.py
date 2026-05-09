from __future__ import annotations
import os

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-to-random-string")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
JWT_EXPIRATION_HOURS_REMEMBER = 24 * 7

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "app.db")
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "backups")
