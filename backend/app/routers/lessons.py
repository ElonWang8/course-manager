from __future__ import annotations
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Lesson, GroupClass
from app.schemas import LessonCreate, LessonUpdate, LessonOut, CheckInRequest, CheckInResponse

router = APIRouter(tags=["课程"])


@router.get("/lessons", response_model=list[LessonOut])
async def list_lessons(
    student_id: str | None = Query(None),
    group_class_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Lesson).options(selectinload(Lesson.student), selectinload(Lesson.group_class))
    if student_id:
        stmt = stmt.where(Lesson.student_id == student_id)
    if group_class_id:
        stmt = stmt.where(Lesson.group_class_id == group_class_id)
    if date_from:
        stmt = stmt.where(Lesson.date >= datetime.fromisoformat(date_from))
    if date_to:
        stmt = stmt.where(Lesson.date <= datetime.fromisoformat(date_to))
    if status:
        stmt = stmt.where(Lesson.status == status)
    result = await db.execute(stmt.order_by(Lesson.date.desc()))
    return [_to_out(l) for l in result.scalars().all()]


@router.post("/lessons", response_model=LessonOut, status_code=201)
async def create_lesson(body: LessonCreate, db: AsyncSession = Depends(get_db)):
    l = Lesson(
        student_id=body.student_id,
        group_class_id=body.group_class_id,
        date=body.date,
        duration=body.duration,
        content=body.content,
        status=body.status,
        is_rescheduled=body.is_rescheduled,
    )
    db.add(l)
    await db.commit()
    await db.refresh(l)
    return await _get_with_relations(l.id, db)


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
async def update_lesson(lesson_id: str, body: LessonUpdate, db: AsyncSession = Depends(get_db)):
    l = await db.get(Lesson, uuid.UUID(lesson_id))
    if not l:
        raise HTTPException(404, "课程不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(l, k, v)
    await db.commit()
    await db.refresh(l)
    return await _get_with_relations(l.id, db)


@router.delete("/lessons/{lesson_id}", status_code=204)
async def delete_lesson(lesson_id: str, db: AsyncSession = Depends(get_db)):
    l = await db.get(Lesson, uuid.UUID(lesson_id))
    if not l:
        raise HTTPException(404, "课程不存在")
    await db.delete(l)
    await db.commit()


@router.post("/lessons/checkin", response_model=CheckInResponse)
async def check_in_group(body: CheckInRequest, db: AsyncSession = Depends(get_db)):
    gc = await db.get(GroupClass, uuid.UUID(str(body.group_class_id)))
    if not gc:
        raise HTTPException(404, "集体课不存在")

    count = 0
    for sid in body.student_ids:
        lesson = Lesson(
            student_id=sid,
            group_class_id=body.group_class_id,
            date=body.date,
            duration=45,
            status="completed",
        )
        db.add(lesson)
        count += 1

    gc.completed_lessons += 1
    await db.commit()

    remaining = max(0, gc.total_lessons - gc.completed_lessons)
    warning = None
    if remaining <= 2:
        warning = f"该集体课仅剩 {remaining} 课时，请及时续费"

    return CheckInResponse(lessons_created=count, remaining_lessons=remaining, warning=warning)


async def _get_with_relations(lesson_id, db):
    stmt = select(Lesson).options(selectinload(Lesson.student), selectinload(Lesson.group_class)).where(Lesson.id == lesson_id)
    result = await db.execute(stmt)
    return _to_out(result.scalar_one())


def _to_out(l: Lesson) -> LessonOut:
    return LessonOut(
        id=l.id, student_id=l.student_id, group_class_id=l.group_class_id,
        date=l.date, duration=l.duration, content=l.content, status=l.status,
        is_rescheduled=l.is_rescheduled, created_at=l.created_at,
        student_name=l.student.name if l.student else None,
        group_class_name=l.group_class.name if l.group_class else None,
    )
