from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy import Uuid


class Base(DeclarativeBase):
    pass


group_class_students = Table(
    "group_class_students",
    Base.metadata,
    Column("group_class_id", Uuid, ForeignKey("group_classes.id", ondelete="CASCADE"), primary_key=True),
    Column("student_id", Uuid, ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
)


class Student(Base):
    __tablename__ = "students"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    grade = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    lessons = relationship("Lesson", back_populates="student", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
    schedule_slots = relationship("ScheduleSlot", back_populates="student", cascade="all, delete-orphan")
    group_classes = relationship("GroupClass", secondary=group_class_students, back_populates="students")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    student_id = Column(Uuid, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    group_class_id = Column(Uuid, ForeignKey("group_classes.id", ondelete="SET NULL"), nullable=True)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    duration = Column(Integer, default=45)
    content = Column(Text, nullable=True)
    status = Column(String(20), default="scheduled")
    is_rescheduled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="lessons")
    group_class = relationship("GroupClass", back_populates="lessons")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    student_id = Column(Uuid, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    group_class_id = Column(Uuid, ForeignKey("group_classes.id", ondelete="SET NULL"), nullable=True)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    amount = Column(Float, default=0)
    validity_start = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    validity_end = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    payment_method = Column(String(20), default="wechat")
    lesson_count = Column(Integer, default=4)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="payments")
    group_class = relationship("GroupClass", back_populates="payments")


class GroupClass(Base):
    __tablename__ = "group_classes"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    total_lessons = Column(Integer, default=0)
    completed_lessons = Column(Integer, default=0)
    price = Column(Float, default=0)
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    students = relationship("Student", secondary=group_class_students, back_populates="group_classes")
    lessons = relationship("Lesson", back_populates="group_class", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="group_class", cascade="all, delete-orphan")
    schedule_slots = relationship("ScheduleSlot", back_populates="group_class", cascade="all, delete-orphan")


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    schedule_type = Column(String(20), default="individual")
    student_id = Column(Uuid, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    group_class_id = Column(Uuid, ForeignKey("group_classes.id", ondelete="SET NULL"), nullable=True)
    weekday = Column(Integer, default=2)
    hour = Column(Integer, default=16)
    minute = Column(Integer, default=0)
    duration = Column(Integer, default=45)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="schedule_slots")
    group_class = relationship("GroupClass", back_populates="schedule_slots")
