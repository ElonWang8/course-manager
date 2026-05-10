import { useState, useEffect } from "react";
import api from "../api/client";
import { BackupInfo } from "../types";

export default function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [msg, setMsg] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const res = await api.get("/backup/list");
      setBackups(res.data);
    } catch {
      // ignore
    }
  };

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleExportLessons = async () => {
    try {
      const res = await api.get("/export/lessons", { responseType: "blob" });
      downloadBlob(res.data, "lessons.csv");
      showMsg("课程导出成功");
    } catch {
      showMsg("导出失败");
    }
  };

  const handleExportPayments = async () => {
    try {
      const res = await api.get("/export/payments", { responseType: "blob" });
      downloadBlob(res.data, "payments.csv");
      showMsg("缴费导出成功");
    } catch {
      showMsg("导出失败");
    }
  };

  const handleCreateBackup = async () => {
    try {
      await api.post("/backup/create");
      showMsg("备份创建成功");
      loadBackups();
    } catch {
      showMsg("备份失败");
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const res = await api.get(`/backup/download/${filename}`, { responseType: "blob" });
      downloadBlob(res.data, filename);
    } catch {
      showMsg("下载失败");
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    if (!confirm(`确定要用 ${restoreFile.name} 恢复数据库吗？当前数据将被覆盖！`)) return;
    try {
      const form = new FormData();
      form.append("file", restoreFile);
      await api.post("/backup/restore", form);
      showMsg("恢复成功，请刷新页面");
      setRestoreFile(null);
    } catch {
      showMsg("恢复失败");
    }
  };

  const downloadBlob = (data: Blob, filename: string) => {
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm text-center">{msg}</div>
      )}

      {/* Export */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-medium text-gray-700 mb-3">数据导出</h3>
        <div className="flex gap-2">
          <button onClick={handleExportLessons} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">导出课程 CSV</button>
          <button onClick={handleExportPayments} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">导出缴费 CSV</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">导出文件含 UTF-8 BOM，可在 Excel 中直接打开。凌晨 3 点自动备份。</p>
      </div>

      {/* Backup */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-medium text-gray-700 mb-3">备份管理</h3>
        <button onClick={handleCreateBackup} className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm mb-4">
          立即创建备份
        </button>

        <div className="space-y-1 mb-4 max-h-60 overflow-auto">
          {backups.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-4">暂无备份</p>
          ) : (
            backups.map((b) => (
              <div key={b.filename} className="flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-gray-600">{b.filename}</div>
                  <div className="text-xs text-gray-400">{b.created_at} · {formatBytes(b.size)}</div>
                </div>
                <button onClick={() => handleDownloadBackup(b.filename)} className="text-blue-500 text-xs">下载</button>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">恢复数据库</h4>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="flex-1 text-sm"
            />
            <button
              onClick={handleRestore}
              disabled={!restoreFile}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              恢复
            </button>
          </div>
          <p className="text-xs text-red-400 mt-1">恢复将覆盖当前所有数据，请谨慎操作</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { if (confirm("确定退出登录？")) onLogout(); }}
        className="w-full py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50"
      >
        退出登录
      </button>

      <p className="text-center text-xs text-gray-300 pb-4">钢琴课时管理 v1.0</p>
    </div>
  );
}
