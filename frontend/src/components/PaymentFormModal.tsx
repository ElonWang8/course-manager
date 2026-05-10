import { useState } from "react";
import api from "../api/client";

interface Props {
  studentId?: string;
  groupClassId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function PaymentFormModal({ studentId, groupClassId, onClose, onSaved }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [lessonCount, setLessonCount] = useState("4");
  const [method, setMethod] = useState("wechat");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    try {
      await api.post("/payments", {
        student_id: studentId || undefined,
        group_class_id: groupClassId || undefined,
        date: new Date(date).toISOString(),
        amount: parseFloat(amount) || 0,
        lesson_count: parseInt(lessonCount) || 4,
        payment_method: method,
        notes: notes || undefined,
      });
      onSaved();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-20">
        <h3 className="font-semibold mb-4">添加缴费</h3>
        <div className="space-y-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额 (元)" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="number" value={lessonCount} onChange={(e) => setLessonCount(e.target.value)} placeholder="课时数" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="wechat">微信</option>
            <option value="alipay">支付宝</option>
            <option value="cash">现金</option>
            <option value="bankTransfer">银行转账</option>
            <option value="other">其他</option>
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="备注（可选）" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm">取消</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}
