import { useState } from "react";
import api from "../api/client";

interface Props {
  studentId?: string;
  groupClassId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function LessonFormModal({ studentId, groupClassId, onClose, onSaved }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("16:00");
  const [duration, setDuration] = useState("45");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("scheduled");

  const handleSave = async () => {
    try {
      await api.post("/lessons", {
        student_id: studentId || undefined,
        group_class_id: groupClassId || undefined,
        date: new Date(date + "T" + time + ":00+08:00").toISOString(),
        duration: parseInt(duration) || 45,
        content: content || undefined,
        status,
      });
      onSaved();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-20">
        <h3 className="font-semibold mb-4">添加课程</h3>
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
