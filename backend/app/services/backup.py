from __future__ import annotations
import os
import glob
import time
import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.config import DATABASE_PATH, BACKUP_DIR

TZ = ZoneInfo("Asia/Shanghai")
MAX_BACKUPS = 30

scheduler = AsyncIOScheduler(timezone=TZ)


def create_backup() -> str:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    now = datetime.now(TZ)
    filename = f"backup_{now.strftime('%Y%m%d_%H%M%S')}.db"
    path = os.path.join(BACKUP_DIR, filename)

    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute(f"VACUUM INTO '{path}'")
    finally:
        conn.close()

    _cleanup()
    return filename


def list_backups() -> list[dict]:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, "backup_*.db")), reverse=True)
    result = []
    for f in files:
        basename = os.path.basename(f)
        stat = os.stat(f)
        ctime = datetime.fromtimestamp(stat.st_ctime, tz=TZ).strftime("%Y-%m-%d %H:%M:%S")
        result.append({"filename": basename, "size": stat.st_size, "created_at": ctime})
    return result


def restore_from_file(src: str) -> None:
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        conn.close()
        conn = sqlite3.connect(DATABASE_PATH)

        src_conn = sqlite3.connect(src)
        src_conn.backup(conn)
        src_conn.close()
    finally:
        conn.close()


def _cleanup():
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, "backup_*.db")))
    while len(files) > MAX_BACKUPS:
        os.remove(files.pop(0))


def _auto_backup():
    create_backup()


def start_scheduler():
    scheduler.add_job(_auto_backup, "cron", hour=3, minute=0, id="auto_backup")
    scheduler.start()
