from __future__ import annotations
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Lesson, Payment, Student
from app.schemas import StatisticsOut

router = APIRouter(tags=["统计"])

TZ = ZoneInfo("Asia/Shanghai")


@router.get("/statistics", response_model=StatisticsOut)
async def get_statistics(
    range: str = Query("all"),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(TZ)
    start = _range_start(range, now)

    # total lessons (completed)
    lesson_stmt = select(Lesson).where(Lesson.status == "completed")
    if start:
        lesson_stmt = lesson_stmt.where(Lesson.date >= start)
    lessons = (await db.execute(lesson_stmt)).scalars().all()

    # total income
    payment_stmt = select(Payment)
    if start:
        payment_stmt = payment_stmt.where(Payment.date >= start)
    payments = (await db.execute(payment_stmt)).scalars().all()

    # active students
    student_result = await db.execute(select(Student).where(Student.is_active == True))
    students = student_result.scalars().all()

    # monthly lessons
    monthly_lessons = _group_by_month([l.date for l in lessons], start, now)

    # monthly income
    monthly_income = _group_by_month_income(payments, start, now)

    # student distribution
    student_dist = _student_distribution(lessons, students)

    return StatisticsOut(
        total_lessons=len(lessons),
        total_income=sum(p.amount for p in payments),
        active_students=len(students),
        monthly_lessons=monthly_lessons,
        monthly_income=monthly_income,
        student_distribution=student_dist,
    )


def _range_start(range_str: str, now: datetime) -> datetime | None:
    if range_str == "month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif range_str == "3months":
        return now.replace(day=1) - timedelta(days=60)
    elif range_str == "6months":
        return now.replace(day=1) - timedelta(days=150)
    elif range_str == "year":
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return None


def _group_by_month(dates: list[datetime], start: datetime | None, now: datetime) -> list[dict]:
    buckets: dict[str, int] = {}
    for d in dates:
        d_sh = d.replace(tzinfo=timezone.utc).astimezone(TZ)
        key = d_sh.strftime("%Y-%m")
        buckets[key] = buckets.get(key, 0) + 1

    if start is None and buckets:
        sorted_keys = sorted(buckets.keys())
        start_key = sorted_keys[0]
    elif start:
        start_key = start.strftime("%Y-%m")
    else:
        start_key = now.strftime("%Y-%m")

    result = []
    cursor = datetime.strptime(start_key, "%Y-%m").replace(day=1, tzinfo=TZ)
    end = now.replace(day=1)
    while cursor <= end:
        key = cursor.strftime("%Y-%m")
        result.append({"month": key, "count": buckets.get(key, 0)})
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)
    return result


def _group_by_month_income(payments: list[Payment], start: datetime | None, now: datetime) -> list[dict]:
    buckets: dict[str, float] = {}
    for p in payments:
        d_sh = p.date.replace(tzinfo=timezone.utc).astimezone(TZ)
        key = d_sh.strftime("%Y-%m")
        buckets[key] = buckets.get(key, 0) + p.amount

    if start is None and buckets:
        sorted_keys = sorted(buckets.keys())
        start_key = sorted_keys[0]
    elif start:
        start_key = start.strftime("%Y-%m")
    else:
        start_key = now.strftime("%Y-%m")

    result = []
    cursor = datetime.strptime(start_key, "%Y-%m").replace(day=1, tzinfo=TZ)
    end = now.replace(day=1)
    while cursor <= end:
        key = cursor.strftime("%Y-%m")
        result.append({"month": key, "amount": round(buckets.get(key, 0), 2)})
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)
    return result


def _student_distribution(lessons: list[Lesson], students: list[Student]) -> list[dict]:
    student_map = {s.id: s.name for s in students}
    counts: dict[str, int] = {}
    for l in lessons:
        name = student_map.get(l.student_id, "未知")
        counts[name] = counts.get(name, 0) + 1
    return sorted([{"name": k, "count": v} for k, v in counts.items()], key=lambda x: x["count"], reverse=True)
