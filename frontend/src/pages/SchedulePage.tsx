import { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/zh-cn";
import api from "../api/client";
import { ScheduleSlot, Lesson } from "../types";
import EmptyState from "../components/EmptyState";

dayjs.extend(utc);
dayjs.locale("zh-cn");

export default function SchedulePage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkinMsg, setCheckinMsg] = useState("");

  const monday = dayjs().startOf("week").add(weekOffset, "week");
  const weekDays = Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));

  useEffect(() => {
    loadData();
  }, [weekOffset]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        api.get("/schedule-slots"),
        api.get("/lessons", {
          params: {
            date_from: monday.format("YYYY-MM-DD"),
            date_to: monday.add(6, "day").format("YYYY-MM-DD"),
          },
        }),
      ]);
      setSlots(sRes.data);
      setLessons(lRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getLessonForSlot = (slot: ScheduleSlot, day: dayjs.Dayjs) => {
    return lessons.find(
      (l) =>
        l.date &&
        dayjs.utc(l.date).format("YYYY-MM-DD") === day.format("YYYY-MM-DD") &&
        ((slot.schedule_type === "individual" && l.student_id === slot.student_id) ||
          (slot.schedule_type === "group" && l.group_class_id === slot.group_class_id))
    );
  };

  const handleCheckIn = async (slot: ScheduleSlot, day: dayjs.Dayjs) => {
    try {
      const res = await api.post("/lessons", {
        student_id: slot.student_id || undefined,
        group_class_id: slot.group_class_id || undefined,
        date: day.hour(slot.hour).minute(slot.minute).second(0).toISOString(),
        duration: slot.duration,
        status: "completed",
      });
      setCheckinMsg(`✅ ${slot.display_name} 签到成功`);
      setTimeout(() => setCheckinMsg(""), 2000);
      await loadData();
    } catch {
      setCheckinMsg("签到失败");
      setTimeout(() => setCheckinMsg(""), 2000);
    }
  };

  const handleCancelLesson = async (lessonId: string) => {
    try {
      await api.put(`/lessons/${lessonId}`, { status: "cancelled" });
      await loadData();
    } catch {
      // ignore
    }
  };

  const getSlotLessonsForDay = (day: dayjs.Dayjs) => {
    return slots
      .filter((s) => s.weekday === (day.day() === 0 ? 7 : day.day()))
      .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">上一周</button>
        <h2 className="font-semibold text-gray-700">
          {monday.format("M月D日")} - {monday.add(6, "day").format("M月D日")}
        </h2>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">下一周</button>
      </div>

      {checkinMsg && (
        <div className="mb-3 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm text-center">{checkinMsg}</div>
      )}

      {/* Desktop: 7-column table */}
      <div className="hidden md:grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const daySlots = getSlotLessonsForDay(day);
          const isToday = day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
          return (
            <div key={day.format("YYYY-MM-DD")} className={`border rounded-lg p-2 min-h-[120px] ${isToday ? "border-blue-300 bg-blue-50/30" : "border-gray-100 bg-white"}`}>
              <div className={`text-xs font-medium mb-2 text-center ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                {day.format("ddd M/D")}
              </div>
              {daySlots.length === 0 ? (
                <div className="text-xs text-gray-300 text-center mt-4">-</div>
              ) : (
                <div className="space-y-1">
                  {daySlots.map((slot) => {
                    const lesson = getLessonForSlot(slot, day);
                    return (
                      <div key={slot.id} className="text-xs p-1.5 rounded bg-gray-50 border border-gray-100 group relative">
                        <div className="font-medium truncate">{slot.display_name}</div>
                        <div className="text-gray-400">{slot.time_string}</div>
                        {lesson?.status === "completed" ? (
                          <span className="text-green-500 text-[10px]">已完成</span>
                        ) : lesson?.status === "cancelled" ? (
                          <span className="text-gray-400 text-[10px] line-through">已取消</span>
                        ) : (
                          <div className="hidden group-hover:flex gap-1 mt-1">
                            <button onClick={() => handleCheckIn(slot, day)} className="px-1.5 py-0.5 bg-green-500 text-white rounded text-[10px]">签到</button>
                            <button
                              onClick={async () => {
                                if (lesson) handleCancelLesson(lesson.id);
                                else {
                                  const res = await api.post("/lessons", {
                                    student_id: slot.student_id || undefined,
                                    group_class_id: slot.group_class_id || undefined,
                                    date: day.hour(slot.hour).minute(slot.minute).second(0).toISOString(),
                                    duration: slot.duration,
                                    status: "cancelled",
                                  });
                                  handleCancelLesson(res.data.id);
                                }
                              }}
                              className="px-1.5 py-0.5 bg-gray-300 text-white rounded text-[10px]"
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: list view */}
      <div className="md:hidden space-y-3">
        {weekDays.map((day) => {
          const daySlots = getSlotLessonsForDay(day);
          const isToday = day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
          return (
            <div key={day.format("YYYY-MM-DD")} className={`border rounded-lg p-3 ${isToday ? "border-blue-300 bg-blue-50/30" : "border-gray-100 bg-white"}`}>
              <div className={`font-medium text-sm mb-2 ${isToday ? "text-blue-600" : "text-gray-600"}`}>
                {day.format("M月D日 ddd")}
              </div>
              {daySlots.length === 0 ? (
                <div className="text-xs text-gray-300">无课程</div>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((slot) => {
                    const lesson = getLessonForSlot(slot, day);
                    return (
                      <div key={slot.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{slot.display_name}</span>
                          <span className="text-gray-400 ml-2">{slot.time_string}</span>
                          {slot.location && <span className="text-gray-300 ml-1 text-xs">{slot.location}</span>}
                        </div>
                        {lesson?.status === "completed" ? (
                          <span className="text-green-500 text-xs">已完成</span>
                        ) : lesson?.status === "cancelled" ? (
                          <span className="text-gray-400 text-xs line-through">已取消</span>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={() => handleCheckIn(slot, day)} className="px-2 py-1 bg-green-500 text-white rounded text-xs">签到</button>
                            <button
                              onClick={async () => {
                                if (lesson) handleCancelLesson(lesson.id);
                                else {
                                  const res = await api.post("/lessons", {
                                    student_id: slot.student_id || undefined,
                                    group_class_id: slot.group_class_id || undefined,
                                    date: day.hour(slot.hour).minute(slot.minute).second(0).toISOString(),
                                    duration: slot.duration,
                                    status: "cancelled",
                                  });
                                  handleCancelLesson(res.data.id);
                                }
                              }}
                              className="px-2 py-1 bg-gray-300 text-white rounded text-xs"
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
