import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import api from "../api/client";
import { Lesson, Student } from "../types";
import { LessonStatusBadge } from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

dayjs.locale("zh-cn");

export default function LessonsPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStudent, setFilterStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lRes, sRes] = await Promise.all([api.get("/lessons"), api.get("/students")]);
      setLessons(lRes.data);
      setStudents(sRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await api.put(`/lessons/${id}`, { status });
    loadData();
  };

  const filtered = lessons.filter((l) => {
    if (filterStudent && l.student_id !== filterStudent) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  const calendarDays = () => {
    const start = currentMonth.startOf("month").startOf("week");
    const end = currentMonth.endOf("month").endOf("week");
    const days: dayjs.Dayjs[] = [];
    let d = start;
    while (d.isBefore(end)) {
      days.push(d);
      d = d.add(1, "day");
    }
    return days;
  };

  const getLessonsForDay = (day: dayjs.Dayjs) =>
    filtered.filter((l) => dayjs.utc(l.date).format("YYYY-MM-DD") === day.format("YYYY-MM-DD"));

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm rounded-lg ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-white border"}`}
          >
            列表
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 text-sm rounded-lg ${viewMode === "calendar" ? "bg-blue-500 text-white" : "bg-white border"}`}
          >
            月历
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm flex-1">
          <option value="">全部学生</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
          <option value="">全部状态</option>
          <option value="scheduled">已预约</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {viewMode === "list" ? (
        filtered.length === 0 ? (
          <EmptyState message="暂无课程记录" />
        ) : (
          <div className="space-y-1">
            {filtered.map((l) => (
              <div key={l.id} className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{l.student_name || l.group_class_name || "未指定"}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {dayjs.utc(l.date).format("M月D日 HH:mm")} · {l.duration}分钟
                    {l.content && <span> · {l.content}</span>}
                    {l.is_rescheduled && <span className="text-orange-400"> · 已调课</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LessonStatusBadge status={l.status} />
                  {l.status === "scheduled" && (
                    <>
                      <button onClick={() => handleStatusChange(l.id, "completed")} className="text-xs text-green-500">完成</button>
                      <button onClick={() => handleStatusChange(l.id, "cancelled")} className="text-xs text-gray-400">取消</button>
                    </>
                  )}
                  {(l.status === "completed" || l.status === "cancelled") && (
                    <button onClick={() => handleStatusChange(l.id, "scheduled")} className="text-xs text-blue-400">恢复</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))} className="px-3 py-1 text-sm bg-white border rounded-lg">上个月</button>
            <span className="font-semibold text-sm">{currentMonth.format("YYYY年M月")}</span>
            <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))} className="px-3 py-1 text-sm bg-white border rounded-lg">下个月</button>
          </div>
          <div className="hidden md:grid grid-cols-7 text-xs text-gray-400 mb-1">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} className="text-center py-1">{d}</div>
            ))}
          </div>
          <div className="hidden md:grid grid-cols-7 gap-px bg-gray-100 border rounded-lg overflow-hidden">
            {calendarDays().map((day) => {
              const dayLessons = getLessonsForDay(day);
              const isCurrMonth = day.month() === currentMonth.month();
              return (
                <div key={day.format("YYYY-MM-DD")} className={`bg-white min-h-[60px] p-1 ${!isCurrMonth && "opacity-30"}`}>
                  <div className="text-xs text-gray-400 text-center">{day.date()}</div>
                  {dayLessons.slice(0, 3).map((l) => (
                    <div key={l.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${
                      l.status === "completed" ? "bg-green-100 text-green-700" :
                      l.status === "cancelled" ? "bg-gray-100 text-gray-400 line-through" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {l.student_name || l.group_class_name}
                    </div>
                  ))}
                  {dayLessons.length > 3 && <div className="text-[10px] text-gray-400 text-center">+{dayLessons.length - 3}</div>}
                </div>
              );
            })}
          </div>
          {/* Mobile calendar: list grouped by day */}
          <div className="md:hidden space-y-1">
            {calendarDays().map((day) => {
              const dayLessons = getLessonsForDay(day);
              const isCurrMonth = day.month() === currentMonth.month();
              if (dayLessons.length === 0 || !isCurrMonth) return null;
              return (
                <div key={day.format("YYYY-MM-DD")} className="bg-white border rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">{day.format("M月D日 ddd")}</div>
                  {dayLessons.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-1 text-sm">
                      <span>{l.student_name || l.group_class_name}</span>
                      <LessonStatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
