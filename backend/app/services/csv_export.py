from __future__ import annotations
import io
from zoneinfo import ZoneInfo
from app.models import Lesson, Payment

TZ = ZoneInfo("Asia/Shanghai")


def export_lessons_csv(lessons: list[Lesson]) -> io.BytesIO:
    lines = ["﻿学生姓名,日期,时间,时长(分钟),课堂内容,状态,集体课,是否调课"]
    for l in lessons:
        d_sh = l.date.astimezone(TZ) if l.date.tzinfo else l.date.replace(tzinfo=None).astimezone(TZ)
        date_str = d_sh.strftime("%Y-%m-%d")
        time_str = d_sh.strftime("%H:%M")
        name = _escape(l.student.name if l.student else "")
        gc_name = _escape(l.group_class.name if l.group_class else "")
        content = _escape(l.content or "")
        status_map = {"scheduled": "已预约", "completed": "已完成", "cancelled": "已取消"}
        status = status_map.get(l.status, l.status)
        rescheduled = "是" if l.is_rescheduled else "否"
        lines.append(f"{name},{date_str},{time_str},{l.duration},{content},{status},{gc_name},{rescheduled}")
    return io.BytesIO("\n".join(lines).encode("utf-8"))


def export_payments_csv(payments: list[Payment]) -> io.BytesIO:
    lines = ["﻿学生姓名,缴费日期,金额(元),有效期开始,有效期结束,课时数,支付方式,备注"]
    method_map = {"cash": "现金", "wechat": "微信", "alipay": "支付宝", "bankTransfer": "银行转账", "other": "其他"}
    for p in payments:
        d_sh = p.date.astimezone(TZ) if p.date.tzinfo else p.date.replace(tzinfo=None).astimezone(TZ)
        vs = p.validity_start.astimezone(TZ) if p.validity_start.tzinfo else p.validity_start.replace(tzinfo=None).astimezone(TZ)
        ve = p.validity_end.astimezone(TZ) if p.validity_end.tzinfo else p.validity_end.replace(tzinfo=None).astimezone(TZ)
        name = _escape(p.student.name if p.student else "")
        date_str = d_sh.strftime("%Y-%m-%d")
        vs_str = vs.strftime("%Y-%m-%d")
        ve_str = ve.strftime("%Y-%m-%d")
        method = method_map.get(p.payment_method, p.payment_method)
        notes = _escape(p.notes or "")
        lines.append(f"{name},{date_str},{p.amount:.0f},{vs_str},{ve_str},{p.lesson_count},{method},{notes}")
    return io.BytesIO("\n".join(lines).encode("utf-8"))


def _escape(s: str) -> str:
    if any(c in s for c in [",", '"', "\n"]):
        return '"' + s.replace('"', '""') + '"'
    return s
