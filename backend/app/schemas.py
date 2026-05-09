from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class StudentBase(BaseModel):
    name: str
    phone: str | None = None
    age: int | None = None
    grade: str | None = None
    notes: str | None = None
    is_active: bool = True


class StudentCreate(StudentBase):
    start_date: datetime | None = None


class StudentUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    age: int | None = None
    grade: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class StudentOut(StudentBase):
    id: uuid.UUID
    start_date: datetime
    created_at: datetime
    completed_lesson_count: int = 0
    purchased_lesson_count: int = 0
    remaining_lessons: int = 0

    model_config = {"from_attributes": True}


class StudentDetailOut(StudentOut):
    lessons: list["LessonOut"] = []
    payments: list["PaymentOut"] = []
    schedule_slots: list["ScheduleSlotOut"] = []


class LessonBase(BaseModel):
    duration: int = 45
    content: str | None = None
    status: str = "scheduled"
    is_rescheduled: bool = False


class LessonCreate(LessonBase):
    student_id: uuid.UUID | None = None
    group_class_id: uuid.UUID | None = None
    date: datetime


class LessonUpdate(BaseModel):
    date: datetime | None = None
    duration: int | None = None
    content: str | None = None
    status: str | None = None
    is_rescheduled: bool | None = None


class LessonOut(LessonBase):
    id: uuid.UUID
    student_id: uuid.UUID | None = None
    group_class_id: uuid.UUID | None = None
    date: datetime
    created_at: datetime
    student_name: str | None = None
    group_class_name: str | None = None

    model_config = {"from_attributes": True}


class PaymentBase(BaseModel):
    amount: float = 0
    payment_method: str = "wechat"
    lesson_count: int = 4
    notes: str | None = None


class PaymentCreate(PaymentBase):
    student_id: uuid.UUID | None = None
    group_class_id: uuid.UUID | None = None
    date: datetime | None = None
    validity_start: datetime | None = None
    validity_end: datetime | None = None


class PaymentUpdate(BaseModel):
    amount: float | None = None
    payment_method: str | None = None
    lesson_count: int | None = None
    notes: str | None = None
    validity_start: datetime | None = None
    validity_end: datetime | None = None
    date: datetime | None = None


class PaymentOut(PaymentBase):
    id: uuid.UUID
    student_id: uuid.UUID | None = None
    group_class_id: uuid.UUID | None = None
    date: datetime
    validity_start: datetime
    validity_end: datetime
    created_at: datetime
    student_name: str | None = None

    model_config = {"from_attributes": True}


class GroupClassBase(BaseModel):
    name: str
    total_lessons: int = 0
    price: float = 0
    notes: str | None = None
    is_active: bool = True


class GroupClassCreate(GroupClassBase):
    student_ids: list[uuid.UUID] = []
    start_date: datetime | None = None


class GroupClassUpdate(BaseModel):
    name: str | None = None
    total_lessons: int | None = None
    price: float | None = None
    notes: str | None = None
    is_active: bool | None = None
    student_ids: list[uuid.UUID] | None = None


class GroupClassOut(GroupClassBase):
    id: uuid.UUID
    completed_lessons: int = 0
    start_date: datetime
    created_at: datetime
    student_count: int = 0
    remaining_lessons: int = 0

    model_config = {"from_attributes": True}


class GroupClassDetailOut(GroupClassOut):
    students: list[StudentOut] = []
    schedule_slots: list["ScheduleSlotOut"] = []


class ScheduleSlotBase(BaseModel):
    schedule_type: str = "individual"
    weekday: int = 2
    hour: int = 16
    minute: int = 0
    duration: int = 45
    location: str | None = None
    notes: str | None = None
    is_active: bool = True


class ScheduleSlotCreate(ScheduleSlotBase):
    student_id: uuid.UUID | None = None
    group_class_id: uuid.UUID | None = None


class ScheduleSlotUpdate(BaseModel):
    schedule_type: str | None = None
    weekday: int | None = None
    hour: int | None = None
    minute: int | None = None
    duration: int | None = None
    location: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class ScheduleSlotOut(ScheduleSlotBase):
    id: uuid.UUID
    student_id: uuid.UUID | None = None
    group_class_id: uuid.UUID | None = None
    created_at: datetime
    display_name: str = ""
    weekday_name: str = ""
    time_string: str = ""

    model_config = {"from_attributes": True}


class StatisticsOut(BaseModel):
    total_lessons: int = 0
    total_income: float = 0
    active_students: int = 0
    monthly_lessons: list[dict] = []
    monthly_income: list[dict] = []
    student_distribution: list[dict] = []


class LoginRequest(BaseModel):
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    expires_at: datetime


class BackupInfo(BaseModel):
    filename: str
    size: int
    created_at: str


class CheckInRequest(BaseModel):
    group_class_id: uuid.UUID
    date: datetime
    student_ids: list[uuid.UUID]


class CheckInResponse(BaseModel):
    lessons_created: int
    remaining_lessons: int
    warning: str | None = None
