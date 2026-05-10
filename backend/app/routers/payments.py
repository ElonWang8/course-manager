from __future__ import annotations
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Payment
from app.schemas import PaymentCreate, PaymentUpdate, PaymentOut

router = APIRouter(tags=["缴费"])


@router.get("/payments", response_model=list[PaymentOut])
async def list_payments(
    student_id: str | None = Query(None),
    group_class_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payment).options(selectinload(Payment.student), selectinload(Payment.group_class))
    if student_id:
        stmt = stmt.where(Payment.student_id == student_id)
    if group_class_id:
        stmt = stmt.where(Payment.group_class_id == group_class_id)
    if date_from:
        stmt = stmt.where(Payment.date >= datetime.fromisoformat(date_from))
    if date_to:
        stmt = stmt.where(Payment.date <= datetime.fromisoformat(date_to))
    result = await db.execute(stmt.order_by(Payment.date.desc()))
    return [_to_out(p) for p in result.scalars().all()]


@router.post("/payments", response_model=PaymentOut, status_code=201)
async def create_payment(body: PaymentCreate, db: AsyncSession = Depends(get_db)):
    p = Payment(
        student_id=body.student_id,
        group_class_id=body.group_class_id,
        date=body.date or datetime.now(timezone.utc),
        amount=body.amount,
        validity_start=body.validity_start or datetime.now(timezone.utc),
        validity_end=body.validity_end or datetime.now(timezone.utc),
        payment_method=body.payment_method,
        lesson_count=body.lesson_count,
        notes=body.notes,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return await _get_with_relations(p.id, db)


@router.put("/payments/{payment_id}", response_model=PaymentOut)
async def update_payment(payment_id: str, body: PaymentUpdate, db: AsyncSession = Depends(get_db)):
    p = await db.get(Payment, uuid.UUID(payment_id))
    if not p:
        raise HTTPException(404, "缴费记录不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return await _get_with_relations(p.id, db)


@router.delete("/payments/{payment_id}", status_code=204)
async def delete_payment(payment_id: str, db: AsyncSession = Depends(get_db)):
    p = await db.get(Payment, uuid.UUID(payment_id))
    if not p:
        raise HTTPException(404, "缴费记录不存在")
    await db.delete(p)
    await db.commit()


async def _get_with_relations(pid, db):
    stmt = select(Payment).options(selectinload(Payment.student), selectinload(Payment.group_class)).where(Payment.id == pid)
    result = await db.execute(stmt)
    return _to_out(result.scalar_one())


def _to_out(p: Payment) -> PaymentOut:
    return PaymentOut(
        id=p.id, student_id=p.student_id, group_class_id=p.group_class_id,
        date=p.date, amount=p.amount, validity_start=p.validity_start,
        validity_end=p.validity_end, payment_method=p.payment_method,
        lesson_count=p.lesson_count, notes=p.notes, created_at=p.created_at,
        student_name=p.student.name if p.student else None,
    )
