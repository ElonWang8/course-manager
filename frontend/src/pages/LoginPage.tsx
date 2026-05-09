import { useState } from "react";
import api from "../api/client";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { password, remember });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("expires_at", res.data.expires_at);
        onLogin();
      } else {
        setError("密码错误");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "登录失败，请检查后端是否正常运行");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-center mb-1">钢琴课时管理</h1>
          <p className="text-sm text-gray-400 text-center mb-6">请输入密码登录</p>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="管理密码"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm text-gray-500">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
              记住我（7天）
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
