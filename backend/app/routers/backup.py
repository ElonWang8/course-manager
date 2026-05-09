from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from app.config import BACKUP_DIR
from app.services.backup import create_backup, list_backups, restore_from_file

router = APIRouter(tags=["备份"])


@router.get("/backup/list")
def backup_list():
    return list_backups()


@router.post("/backup/create")
def backup_create():
    filename = create_backup()
    return {"filename": filename}


@router.get("/backup/download/{filename}")
def backup_download(filename: str):
    import os
    path = os.path.join(BACKUP_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(404, "备份文件不存在")
    return FileResponse(path, filename=filename)


@router.post("/backup/restore")
async def backup_restore(file: UploadFile):
    if not file.filename:
        raise HTTPException(400, "未选择文件")
    import os, tempfile, shutil
    tmp = os.path.join(tempfile.gettempdir(), file.filename)
    try:
        with open(tmp, "wb") as f:
            shutil.copyfileobj(file.file, f)
        restore_from_file(tmp)
        return {"message": "恢复成功"}
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
