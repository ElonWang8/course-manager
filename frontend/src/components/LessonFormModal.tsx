import { useState } from "react";
import dayjs from "dayjs";
import api from "../api/client";
import { Lesson } from "../types";

interface Props {
  studentId?: string;
  groupClassId?: string;
  editLesson?: Lesson | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function LessonFormModal({ studentId, groupClassId, editLesson, onClose, onSaved }: Props) {
  const isEdit = !!editLesson;
  const d = editLesson ? dayjs(editLesson.date) : dayjs();

  const [date, setDate] = useState(d.format("YYYY-MM-DD"));
  const [time, setTime] = useState(d.format("HH:mm"));
  const [duration, setDuration] = useState(editLesson ? String(editLesson.duration) : "45");
  const [content, setContent] = useState(editLesson?.content || "");
  const [status, setStatus] = useState(editLesson?.status || "scheduled");

  const handleSave = async () => {
    try {
      const payload = {
        student_id: studentId || undefined,
        group_class_id: groupClassId || undefined,
        date: date + "T" + time + ":00",
        duration: parseInt(duration) || 45,
        content: content || undefined,
        status,
      };
      if (isEdit) {
        await api.put(`/lessons/${editLesson!.id}`, payload);
      } else {
        await api.post("/lessons", payload);
      }
      onSaved();
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!editLesson || !confirm("确定删除此课程？")) return;
    try {
      await api.delete(`/lessons/${editLesson.id}`);
      onSaved();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{isEdit ? "编辑课程" : "添加课程"}</h3>
          {isEdit && (
            <button onClick={handleDelete} className="text-red-400 text-sm">删除</button>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="时长（分钟）" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="课堂内容（可选）" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="scheduled">已预约</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm">取消</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}
