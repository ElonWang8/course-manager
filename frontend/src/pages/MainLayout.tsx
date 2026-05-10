import { Routes, Route, NavLink, Navigate } from "react-router-dom";

const tabs = [
  { path: "/schedule", label: "课程表", icon: "📅" },
  { path: "/students", label: "学生", icon: "👥" },
  { path: "/lessons", label: "课程", icon: "📖" },
  { path: "/statistics", label: "统计", icon: "📊" },
  { path: "/settings", label: "设置", icon: "⚙️" },
];

export default function MainLayout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage onLogout={onLogout} />} />
        </Routes>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
        <div className="max-w-5xl mx-auto flex">
          {tabs.map((t) => (
            <NavLink
              key={t.path}
              to={t.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                  isActive ? "text-blue-500" : "text-gray-400"
                }`
              }
            >
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

import SchedulePage from "./SchedulePage";
import StudentsPage from "./StudentsPage";
import LessonsPage from "./LessonsPage";
import StatisticsPage from "./StatisticsPage";
import SettingsPage from "./SettingsPage";
