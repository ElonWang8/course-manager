import { useState, useEffect } from "react";
import api from "../api/client";
import { Student, GroupClass } from "../types";
import { ActiveBadge } from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

export default function StudentsPage() {
  const [segment, setSegment] = useState<"individual" | "group">("individual");
  const [students, setStudents] = useState<Student[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", grade: "", notes: "", is_active: true });

  useEffect(() => {
    loadData();
  }, [segment]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (segment === "individual") {
        const res = await api.get("/students");
        setStudents(res.data);
      } else {
        const res = await api.get("/group-classes");
        setGroupClasses(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, { name: form.name, phone: form.phone, grade: form.grade, notes: form.notes });
      } else {
        await api.post("/students", { name: form.name, phone: form.phone, grade: form.grade, notes: form.notes });
      }
      setShowForm(false);
      setForm({ name: "", phone: "", grade: "", notes: "", is_active: true });
      setEditingId(null);
      loadData();
    } catch {
      // ignore
    }
  };

  const toggleStudentActive = async (s: Student) => {
    await api.put(`/students/${s.id}`, { is_active: !s.is_active });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    if (segment === "individual") {
      await api.delete(`/students/${id}`);
    } else {
      await api.delete(`/group-classes/${id}`);
    }
    loadData();
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSegment("individual")}
          className={`flex-1 py-2 text-sm rounded-lg font-medium ${segment === "individual" ? "bg-blue-500 text-white" : "bg-white border text-gray-500"}`}
        >
          一对一学生
        </button>
        <button
          onClick={() => setSegment("group")}
          className={`flex-1 py-2 text-sm rounded-lg font-medium ${segment === "group" ? "bg-blue-500 text-white" : "bg-white border text-gray-500"}`}
        >
          集体课
        </button>
      </div>

      <div className="flex justify-end mb-3">
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", phone: "", grade: "", notes: "", is_active: true });
            setShowForm(true);
          }}
          className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg"
        >
          {segment === "individual" ? "+ 新增学生" : "+ 新增集体课"}
        </button>
      </div>

      {segment === "individual" ? (
        students.length === 0 ? (
          <EmptyState message="暂无学生，点击右上角添加" />
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    剩余课时 <span className={s.remaining_lessons <= 2 ? "text-red-500 font-medium" : "text-gray-600"}>{s.remaining_lessons}</span>
                    {" · "}已完成 {s.completed_lesson_count} 节
                    {s.phone && <span>{" · "}{s.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActiveBadge active={s.is_active} />
                  <button onClick={() => toggleStudentActive(s)} className="text-xs text-blue-500">切换</button>
                  <button
                    onClick={() => {
                      setEditingId(s.id);
                      setForm({ name: s.name, phone: s.phone || "", grade: s.grade || "", notes: s.notes || "", is_active: s.is_active });
                      setShowForm(true);
                    }}
                    className="text-xs text-gray-400"
                  >
                    编辑
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400">删除</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        groupClasses.length === 0 ? (
          <EmptyState message="暂无集体课，点击右上角添加" />
        ) : (
          <div className="space-y-2">
            {groupClasses.map((gc) => (
              <div key={gc.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{gc.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {gc.student_count} 名学生 · 剩余 <span className={gc.remaining_lessons <= 2 ? "text-red-500 font-medium" : "text-gray-600"}>{gc.remaining_lessons}</span> 课时 · ¥{gc.price}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActiveBadge active={gc.is_active} />
                  <button onClick={() => handleDelete(gc.id)} className="text-xs text-red-400">删除</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{editingId ? "编辑" : "新增"}{segment === "individual" ? "学生" : "集体课"}</h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="姓名 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="手机号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="年级" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg text-sm">取消</button>
              <button onClick={handleSaveStudent} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
