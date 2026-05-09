from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import GroupClass, Student
from app.schemas import GroupClassCreate, GroupClassUpdate, GroupClassOut, GroupClassDetailOut, StudentOut

router = APIRouter(tags=["集体课"])


@router.get("/group-classes", response_model=list[GroupClassOut])
async def list_group_classes(
    active: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(GroupClass).options(selectinload(GroupClass.students))
    if active is not None:
        stmt = stmt.where(GroupClass.is_active == active)
    result = await db.execute(stmt.order_by(GroupClass.name))
    return [_to_out(gc) for gc in result.scalars().all()]


@router.post("/group-classes", response_model=GroupClassOut, status_code=201)
async def create_group_class(body: GroupClassCreate, db: AsyncSession = Depends(get_db)):
    gc = GroupClass(
        name=body.name,
        total_lessons=body.total_lessons,
        price=body.price,
        notes=body.notes,
        is_active=body.is_active,
        start_date=body.start_date or datetime.now(timezone.utc),
    )
    if body.student_ids:
        stmt = select(Student).where(Student.id.in_(body.student_ids))
        students = (await db.execute(stmt)).scalars().all()
        gc.students = list(students)
    db.add(gc)
    await db.commit()
    await db.refresh(gc)
    return _to_out(gc)


@router.get("/group-classes/{gc_id}", response_model=GroupClassDetailOut)
async def get_group_class(gc_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(GroupClass).options(
        selectinload(GroupClass.students).selectinload(Student.lessons),
        selectinload(GroupClass.students).selectinload(Student.payments),
        selectinload(GroupClass.schedule_slots),
    ).where(GroupClass.id == gc_id)
    result = await db.execute(stmt)
    gc = result.scalar_one_or_none()
    if not gc:
        raise HTTPException(404, "集体课不存在")
    return _to_detail(gc)


@router.put("/group-classes/{gc_id}", response_model=GroupClassOut)
async def update_group_class(gc_id: str, body: GroupClassUpdate, db: AsyncSession = Depends(get_db)):
    gc = await db.get(GroupClass, gc_id)
    if not gc:
        raise HTTPException(404, "集体课不存在")

    update_data = body.model_dump(exclude_unset=True)
    student_ids = update_data.pop("student_ids", None)
    for k, v in update_data.items():
        setattr(gc, k, v)

    if student_ids is not None:
        stmt = select(Student).where(Student.id.in_(student_ids))
        students = (await db.execute(stmt)).scalars().all()
        gc.students = list(students)

    await db.commit()
    await db.refresh(gc)
    return _to_out(gc)


@router.delete("/group-classes/{gc_id}", status_code=204)
async def delete_group_class(gc_id: str, db: AsyncSession = Depends(get_db)):
    gc = await db.get(GroupClass, gc_id)
    if not gc:
        raise HTTPException(404, "集体课不存在")
    await db.delete(gc)
    await db.commit()


def _to_out(gc: GroupClass) -> GroupClassOut:
    return GroupClassOut(
        id=gc.id, name=gc.name, total_lessons=gc.total_lessons,
        completed_lessons=gc.completed_lessons, price=gc.price,
        start_date=gc.start_date, notes=gc.notes, is_active=gc.is_active,
        created_at=gc.created_at, student_count=len(gc.students or []),
        remaining_lessons=max(0, gc.total_lessons - gc.completed_lessons),
    )


def _to_detail(gc: GroupClass) -> GroupClassDetailOut:
    students_out = []
    for s in (gc.students or []):
        completed = sum(1 for l in (s.lessons or []) if l.status == "completed")
        purchased = sum(p.lesson_count for p in (s.payments or []))
        students_out.append(StudentOut(
            id=s.id, name=s.name, phone=s.phone, age=s.age, grade=s.grade,
            notes=s.notes, start_date=s.start_date, is_active=s.is_active,
            created_at=s.created_at, completed_lesson_count=completed,
            purchased_lesson_count=purchased, remaining_lessons=max(0, purchased - completed),
        ))

    from app.routers.students import _slot_out
    return GroupClassDetailOut(
        id=gc.id, name=gc.name, total_lessons=gc.total_lessons,
        completed_lessons=gc.completed_lessons, price=gc.price,
        start_date=gc.start_date, notes=gc.notes, is_active=gc.is_active,
        created_at=gc.created_at, student_count=len(gc.students or []),
        remaining_lessons=max(0, gc.total_lessons - gc.completed_lessons),
        students=students_out,
        schedule_slots=[_slot_out(sl) for sl in (gc.schedule_slots or [])],
    )
