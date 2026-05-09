from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Student
from app.schemas import StudentCreate, StudentUpdate, StudentOut, StudentDetailOut

router = APIRouter(tags=["学生"])


@router.get("/students", response_model=list[StudentOut])
async def list_students(
    active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Student).options(selectinload(Student.lessons), selectinload(Student.payments))
    if active is not None:
        stmt = stmt.where(Student.is_active == active)
    result = await db.execute(stmt.order_by(Student.name))
    students = result.scalars().all()

    out = []
    for s in students:
        completed = sum(1 for l in (s.lessons or []) if l.status == "completed")
        purchased = sum(p.lesson_count for p in (s.payments or []))
        out.append(StudentOut(
            id=s.id,
            name=s.name,
            phone=s.phone,
            age=s.age,
            grade=s.grade,
            notes=s.notes,
            start_date=s.start_date,
            is_active=s.is_active,
            created_at=s.created_at,
            completed_lesson_count=completed,
            purchased_lesson_count=purchased,
            remaining_lessons=max(0, purchased - completed),
        ))
    return out


@router.post("/students", response_model=StudentOut, status_code=201)
async def create_student(body: StudentCreate, db: AsyncSession = Depends(get_db)):
    s = Student(
        name=body.name,
        phone=body.phone,
        age=body.age,
        grade=body.grade,
        notes=body.notes,
        is_active=body.is_active,
        start_date=body.start_date or datetime.now(timezone.utc),
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return StudentOut(
        id=s.id, name=s.name, phone=s.phone, age=s.age, grade=s.grade,
        notes=s.notes, start_date=s.start_date, is_active=s.is_active,
        created_at=s.created_at,
        completed_lesson_count=0, purchased_lesson_count=0, remaining_lessons=0,
    )


@router.get("/students/{student_id}", response_model=StudentDetailOut)
async def get_student(student_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Student).options(
        selectinload(Student.lessons),
        selectinload(Student.payments),
        selectinload(Student.schedule_slots),
        selectinload(Student.group_classes),
    ).where(Student.id == student_id)
    result = await db.execute(stmt)
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "学生不存在")
    completed = sum(1 for l in (s.lessons or []) if l.status == "completed")
    purchased = sum(p.lesson_count for p in (s.payments or []))
    return StudentDetailOut(
        id=s.id, name=s.name, phone=s.phone, age=s.age, grade=s.grade,
        notes=s.notes, start_date=s.start_date, is_active=s.is_active,
        created_at=s.created_at, completed_lesson_count=completed,
        purchased_lesson_count=purchased, remaining_lessons=max(0, purchased - completed),
        lessons=[_lesson_out(l) for l in (s.lessons or [])],
        payments=[_payment_out(p) for p in (s.payments or [])],
        schedule_slots=[_slot_out(sl) for sl in (s.schedule_slots or [])],
    )


@router.put("/students/{student_id}", response_model=StudentOut)
async def update_student(student_id: str, body: StudentUpdate, db: AsyncSession = Depends(get_db)):
    s = await db.get(Student, student_id)
    if not s:
        raise HTTPException(404, "学生不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    await db.commit()
    await db.refresh(s)
    return StudentOut(
        id=s.id, name=s.name, phone=s.phone, age=s.age, grade=s.grade,
        notes=s.notes, start_date=s.start_date, is_active=s.is_active,
        created_at=s.created_at,
        completed_lesson_count=0, purchased_lesson_count=0, remaining_lessons=0,
    )


@router.delete("/students/{student_id}", status_code=204)
async def delete_student(student_id: str, db: AsyncSession = Depends(get_db)):
    s = await db.get(Student, student_id)
    if not s:
        raise HTTPException(404, "学生不存在")
    await db.delete(s)
    await db.commit()


def _to_out(s: Student) -> StudentOut:
    completed = sum(1 for l in (s.lessons or []) if l.status == "completed")
    purchased = sum(p.lesson_count for p in (s.payments or []))
    return StudentOut(
        id=s.id, name=s.name, phone=s.phone, age=s.age, grade=s.grade,
        notes=s.notes, start_date=s.start_date, is_active=s.is_active,
        created_at=s.created_at, completed_lesson_count=completed,
        purchased_lesson_count=purchased, remaining_lessons=max(0, purchased - completed),
    )


def _lesson_out(l):
    from app.schemas import LessonOut
    return LessonOut(
        id=l.id, student_id=l.student_id, group_class_id=l.group_class_id,
        date=l.date, duration=l.duration, content=l.content, status=l.status,
        is_rescheduled=l.is_rescheduled, created_at=l.created_at,
        student_name=l.student.name if l.student else None,
        group_class_name=l.group_class.name if l.group_class else None,
    )


def _payment_out(p):
    from app.schemas import PaymentOut
    return PaymentOut(
        id=p.id, student_id=p.student_id, group_class_id=p.group_class_id,
        date=p.date, amount=p.amount, validity_start=p.validity_start,
        validity_end=p.validity_end, payment_method=p.payment_method,
        lesson_count=p.lesson_count, notes=p.notes, created_at=p.created_at,
        student_name=p.student.name if p.student else None,
    )


def _slot_out(sl):
    from app.schemas import ScheduleSlotOut
    names = ["", "周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    return ScheduleSlotOut(
        id=sl.id, schedule_type=sl.schedule_type, student_id=sl.student_id,
        group_class_id=sl.group_class_id, weekday=sl.weekday, hour=sl.hour,
        minute=sl.minute, duration=sl.duration, location=sl.location,
        notes=sl.notes, is_active=sl.is_active, created_at=sl.created_at,
        display_name=sl.student.name if sl.student else (sl.group_class.name if sl.group_class else "未指定"),
        weekday_name=names[sl.weekday] if 1 <= sl.weekday <= 7 else "未知",
        time_string=f"{sl.hour:02d}:{sl.minute:02d}",
    )
