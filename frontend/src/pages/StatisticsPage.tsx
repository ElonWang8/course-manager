import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import api from "../api/client";
import { Statistics } from "../types";
import StatCard from "../components/StatCard";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const ranges = [
  { key: "month", label: "本月" },
  { key: "3months", label: "近3月" },
  { key: "6months", label: "近6月" },
  { key: "year", label: "本年" },
  { key: "all", label: "全部" },
];

export default function StatisticsPage() {
  const [range, setRange] = useState("month");
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [range]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/statistics", { params: { range } });
      setStats(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 py-1.5 text-xs rounded-lg ${range === r.key ? "bg-blue-500 text-white" : "bg-white border text-gray-500"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard title="总课时" value={String(stats.total_lessons)} color="blue" />
        <StatCard title="总收入" value={`¥${Math.round(stats.total_income)}`} color="green" />
        <StatCard title="活跃学生" value={String(stats.active_students)} color="orange" />
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">月度课时</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.monthly_lessons}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="课时" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">月度收入</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.monthly_income}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `¥${v}`} />
            <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="收入" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {stats.student_distribution.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">学生课时分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.student_distribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }) => `${name} ${count}`}>
                {stats.student_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
