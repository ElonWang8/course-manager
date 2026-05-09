from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Lesson, Payment
from app.services.csv_export import export_lessons_csv, export_payments_csv
from app.routers.lessons import _to_out as lesson_out
from app.routers.payments import _to_out as payment_out

router = APIRouter(tags=["导出"])


@router.get("/export/lessons")
async def export_lessons(db: AsyncSession = Depends(get_db)):
    stmt = select(Lesson).options(selectinload(Lesson.student), selectinload(Lesson.group_class))
    result = await db.execute(stmt.order_by(Lesson.date.desc()))
    lessons = result.scalars().all()
    csv_bytes = export_lessons_csv(lessons)
    return StreamingResponse(
        csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=lessons.csv"},
    )


@router.get("/export/payments")
async def export_payments(db: AsyncSession = Depends(get_db)):
    stmt = select(Payment).options(selectinload(Payment.student), selectinload(Payment.group_class))
    result = await db.execute(stmt.order_by(Payment.date.desc()))
    payments = result.scalars().all()
    csv_bytes = export_payments_csv(payments)
    return StreamingResponse(
        csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=payments.csv"},
    )
