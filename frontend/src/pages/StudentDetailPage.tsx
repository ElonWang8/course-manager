import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/zh-cn";
import api from "../api/client";
import { StudentDetail, Lesson } from "../types";
import { LessonStatusBadge, PaymentMethodBadge } from "../components/StatusBadge";
import LessonFormModal from "../components/LessonFormModal";
import PaymentFormModal from "../components/PaymentFormModal";

dayjs.extend(utc);

const tabs = ["课程记录", "缴费记录", "集体课"];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [lessonSub, setLessonSub] = useState(1); // 0=completed, 1=scheduled
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const loadStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudent(); }, [id]);

  const handleQuickCheckIn = async () => {
    try {
      const now = new Date();
      const local = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + "T" +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":00";
      await api.post("/lessons", {
        student_id: id,
        date: local,
        duration: 45,
        status: "completed",
      });
      loadStudent();
    } catch {
      // ignore
    }
  };

  const handleStatusChange = async (lessonId: string, newStatus: string) => {
    await api.put(`/lessons/${lessonId}`, { status: newStatus });
    loadStudent();
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!student) return <div className="text-center py-16 text-gray-400">学生不存在</div>;

  const remainingColor =
    student.remaining_lessons > 10 ? "text-green-500" :
    student.remaining_lessons >= 3 ? "text-orange-500" : "text-red-500";

  const completedLessons = (student.lessons || []).filter((l) => l.status === "completed").sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
  const scheduledLessons = (student.lessons || []).filter((l) => l.status === "scheduled").sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
  const filteredLessons = lessonSub === 0 ? completedLessons : scheduledLessons;
  const payments = (student.payments || []).sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

  return (
    <div className="pb-24">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="text-sm text-blue-500 mb-3">&larr; 返回</button>

      {/* Student info card */}
      <div className="bg-white rounded-xl border p-5 mb-4 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xl font-bold mx-auto mb-3">
          {student.name[0]}
        </div>
        <h1 className="text-lg font-bold">{student.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-400">
          {student.grade && <span className="bg-gray-100 px-2 py-0.5 rounded">{student.grade}</span>}
          <span className={student.is_active ? "text-green-500" : "text-gray-400"}>
            {student.is_active ? "在读" : "已停课"}
          </span>
          <span>学琴自 {dayjs(student.start_date).format("YYYY年M月")}</span>
        </div>
        {student.phone && <div className="text-xs text-gray-400 mt-1">{student.phone}</div>}
        {student.age && <div className="text-xs text-gray-400">{student.age}岁</div>}
      </div>

      {/* Remaining lessons */}
      <div className="bg-white rounded-xl border p-5 mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">剩余课时</div>
          <div className={`text-3xl font-bold ${remainingColor}`}>{student.remaining_lessons}<span className="text-sm font-normal text-gray-400">节</span></div>
          <div className="text-xs text-gray-400 mt-1">
            已购 {student.purchased_lesson_count} · 已上 {student.completed_lesson_count}
          </div>
        </div>
        <div className="w-14 h-14 rounded-full border-4 border-gray-100 flex items-center justify-center">
          <span className={`text-lg font-bold ${remainingColor}`}>{student.remaining_lessons}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-1.5 text-sm rounded-md ${tab === i ? "bg-white shadow font-medium" : "text-gray-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && (
        <div>
          <div className="flex gap-1 mb-3">
            {["已上课", "未上课"].map((l, i) => (
              <button key={l} onClick={() => setLessonSub(i)}
                className={`flex-1 py-1 text-xs rounded ${lessonSub === i ? "bg-blue-500 text-white" : "bg-white border"}`}
              >{l} ({i === 0 ? completedLessons.length : scheduledLessons.length})</button>
            ))}
          </div>
          {filteredLessons.length === 0 ? (
            <div className="text-center py-10 text-gray-300 text-sm">暂无{lessonSub === 0 ? "已上" : "未上"}课程</div>
          ) : (
            <div className="space-y-1">
              {filteredLessons.map((l) => (
                <div key={l.id} className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="text-xs text-gray-400">{dayjs(l.date).format("M月D日 HH:mm")} · {l.duration}分钟</div>
                    {l.content && <div className="text-xs text-gray-500 mt-0.5">{l.content}</div>}
                    {l.group_class_name && <div className="text-xs text-purple-400">{l.group_class_name}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <LessonStatusBadge status={l.status} />
                    {l.status === "scheduled" && (
                      <button onClick={() => handleStatusChange(l.id, "completed")} className="text-xs text-green-500">签到</button>
                    )}
                    <button onClick={() => { setEditingLesson(l); setShowLessonForm(true); }} className="text-xs text-gray-400">编辑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 1 && (
        payments.length === 0 ? (
          <div className="text-center py-10 text-gray-300 text-sm">暂无缴费记录</div>
        ) : (
          <div className="space-y-1">
            {payments.map((p) => (
              <div key={p.id} className="bg-white border rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">¥{p.amount}</span>
                  <PaymentMethodBadge method={p.payment_method} />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {dayjs(p.date).format("YYYY-MM-DD")} · {p.lesson_count}课时
                  {p.validity_start && <span> · {dayjs(p.validity_start).format("M/D")}-{dayjs(p.validity_end).format("M/D")}</span>}
                </div>
                {p.notes && <div className="text-xs text-gray-500 mt-1">{p.notes}</div>}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 2 && (
        (!student.schedule_slots || student.schedule_slots.length === 0) ? (
          <div className="text-center py-10 text-gray-300 text-sm">未参加集体课</div>
        ) : (
          <div className="space-y-1">
            {student.schedule_slots.filter((s) => s.schedule_type === "group").map((s) => (
              <div key={s.id} className="bg-white border rounded-lg px-4 py-3 text-sm">
                <div className="font-medium">{s.display_name}</div>
                <div className="text-xs text-gray-400">{s.weekday_name} {s.time_string}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Bottom action bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t px-4 py-2 z-[55]">
        <div className="max-w-5xl mx-auto flex gap-2">
          <button onClick={handleQuickCheckIn} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
            今日签到
          </button>
          <button onClick={() => { setEditingLesson(null); setShowLessonForm(true); }} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            添加课程
          </button>
          <button onClick={() => setShowPaymentForm(true)} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
            添加缴费
          </button>
        </div>
      </div>

      {/* Modals */}
      {showLessonForm && (
        <LessonFormModal
          studentId={id}
          editLesson={editingLesson}
          onClose={() => { setShowLessonForm(false); setEditingLesson(null); }}
          onSaved={() => { setShowLessonForm(false); setEditingLesson(null); loadStudent(); }}
        />
      )}
      {showPaymentForm && (
        <PaymentFormModal studentId={id} onClose={() => setShowPaymentForm(false)} onSaved={() => { setShowPaymentForm(false); loadStudent(); }} />
      )}
    </div>
  );
}
