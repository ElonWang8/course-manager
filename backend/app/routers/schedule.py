from __future__ import annotations
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import ScheduleSlot
from app.schemas import ScheduleSlotCreate, ScheduleSlotUpdate, ScheduleSlotOut

router = APIRouter(tags=["排课"])

WEEKDAY_NAMES = ["", "周日", "周一", "周二", "周三", "周四", "周五", "周六"]


@router.get("/schedule-slots", response_model=list[ScheduleSlotOut])
async def list_slots(db: AsyncSession = Depends(get_db)):
    stmt = select(ScheduleSlot).options(
        selectinload(ScheduleSlot.student),
        selectinload(ScheduleSlot.group_class),
    ).where(ScheduleSlot.is_active == True).order_by(ScheduleSlot.weekday, ScheduleSlot.hour, ScheduleSlot.minute)
    result = await db.execute(stmt)
    return [_to_out(sl) for sl in result.scalars().all()]


@router.post("/schedule-slots", response_model=ScheduleSlotOut, status_code=201)
async def create_slot(body: ScheduleSlotCreate, db: AsyncSession = Depends(get_db)):
    sl = ScheduleSlot(
        schedule_type=body.schedule_type,
        student_id=body.student_id,
        group_class_id=body.group_class_id,
        weekday=body.weekday,
        hour=body.hour,
        minute=body.minute,
        duration=body.duration,
        location=body.location,
        notes=body.notes,
        is_active=body.is_active,
    )
    db.add(sl)
    await db.commit()
    await db.refresh(sl)
    return await _get_with_relations(sl.id, db)


@router.put("/schedule-slots/{slot_id}", response_model=ScheduleSlotOut)
async def update_slot(slot_id: str, body: ScheduleSlotUpdate, db: AsyncSession = Depends(get_db)):
    sl = await db.get(ScheduleSlot, uuid.UUID(slot_id))
    if not sl:
        raise HTTPException(404, "排课不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(sl, k, v)
    await db.commit()
    await db.refresh(sl)
    return await _get_with_relations(sl.id, db)


@router.delete("/schedule-slots/{slot_id}", status_code=204)
async def delete_slot(slot_id: str, db: AsyncSession = Depends(get_db)):
    sl = await db.get(ScheduleSlot, uuid.UUID(slot_id))
    if not sl:
        raise HTTPException(404, "排课不存在")
    await db.delete(sl)
    await db.commit()


async def _get_with_relations(sid, db):
    stmt = select(ScheduleSlot).options(
        selectinload(ScheduleSlot.student),
        selectinload(ScheduleSlot.group_class),
    ).where(ScheduleSlot.id == sid)
    result = await db.execute(stmt)
    return _to_out(result.scalar_one())


def _to_out(sl: ScheduleSlot) -> ScheduleSlotOut:
    name = "未指定"
    if sl.student:
        name = sl.student.name
    elif sl.group_class:
        name = sl.group_class.name
    return ScheduleSlotOut(
        id=sl.id, schedule_type=sl.schedule_type, student_id=sl.student_id,
        group_class_id=sl.group_class_id, weekday=sl.weekday,
        hour=sl.hour, minute=sl.minute, duration=sl.duration,
        location=sl.location, notes=sl.notes, is_active=sl.is_active,
        created_at=sl.created_at, display_name=name,
        weekday_name=WEEKDAY_NAMES[sl.weekday] if 1 <= sl.weekday <= 7 else "未知",
        time_string=f"{sl.hour:02d}:{sl.minute:02d}",
    )
