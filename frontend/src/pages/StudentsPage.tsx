import { useState, useEffect } from "react";
import api from "../api/client";
import { Student, GroupClass } from "../types";
import { ActiveBadge } from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

type Segment = "individual" | "group";

interface StudentForm {
  name: string;
  phone: string;
  age: string;
  grade: string;
  notes: string;
  is_active: boolean;
}

interface GroupForm {
  name: string;
  total_lessons: string;
  price: string;
  notes: string;
  is_active: boolean;
}

export default function StudentsPage() {
  const [segment, setSegment] = useState<Segment>("individual");
  const [students, setStudents] = useState<Student[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<StudentForm>({ name: "", phone: "", age: "", grade: "", notes: "", is_active: true });
  const [groupForm, setGroupForm] = useState<GroupForm>({ name: "", total_lessons: "", price: "", notes: "", is_active: true });

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
    if (!studentForm.name.trim()) return;
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, {
          name: studentForm.name, phone: studentForm.phone || undefined,
          age: studentForm.age ? parseInt(studentForm.age) : undefined,
          grade: studentForm.grade || undefined, notes: studentForm.notes || undefined,
        });
      } else {
        await api.post("/students", {
          name: studentForm.name, phone: studentForm.phone || undefined,
          age: studentForm.age ? parseInt(studentForm.age) : undefined,
          grade: studentForm.grade || undefined, notes: studentForm.notes || undefined,
        });
      }
      setShowForm(false);
      setStudentForm({ name: "", phone: "", age: "", grade: "", notes: "", is_active: true });
      setEditingId(null);
      loadData();
    } catch {
      // ignore
    }
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) return;
    try {
      const payload = {
        name: groupForm.name,
        total_lessons: parseInt(groupForm.total_lessons) || 0,
        price: parseFloat(groupForm.price) || 0,
        notes: groupForm.notes || undefined,
      };
      if (editingId) {
        await api.put(`/group-classes/${editingId}`, payload);
      } else {
        await api.post("/group-classes", payload);
      }
      setShowForm(false);
      setGroupForm({ name: "", total_lessons: "", price: "", notes: "", is_active: true });
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
            setStudentForm({ name: "", phone: "", age: "", grade: "", notes: "", is_active: true });
            setGroupForm({ name: "", total_lessons: "", price: "", notes: "", is_active: true });
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
                      setStudentForm({ name: s.name, phone: s.phone || "", age: s.age?.toString() || "", grade: s.grade || "", notes: s.notes || "", is_active: s.is_active });
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
      ) : groupClasses.length === 0 ? (
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
                <button
                  onClick={() => {
                    setEditingId(gc.id);
                    setGroupForm({ name: gc.name, total_lessons: gc.total_lessons.toString(), price: gc.price.toString(), notes: gc.notes || "", is_active: gc.is_active });
                    setShowForm(true);
                  }}
                  className="text-xs text-gray-400"
                >
                  编辑
                </button>
                <button onClick={() => handleDelete(gc.id)} className="text-xs text-red-400">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-20" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">
              {editingId ? "编辑" : "新增"}{segment === "individual" ? "学生" : "集体课"}
            </h3>

            {segment === "individual" ? (
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="姓名 *" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="手机号" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="年龄" type="number" value={studentForm.age} onChange={(e) => setStudentForm({ ...studentForm, age: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="年级" value={studentForm.grade} onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="备注" value={studentForm.notes} onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })} />
              </div>
            ) : (
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="课程名称 *" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="总课时" type="number" value={groupForm.total_lessons} onChange={(e) => setGroupForm({ ...groupForm, total_lessons: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="价格 (元)" type="number" value={groupForm.price} onChange={(e) => setGroupForm({ ...groupForm, price: e.target.value })} />
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="备注" value={groupForm.notes} onChange={(e) => setGroupForm({ ...groupForm, notes: e.target.value })} />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg text-sm">取消</button>
              <button
                onClick={segment === "individual" ? handleSaveStudent : handleSaveGroup}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
