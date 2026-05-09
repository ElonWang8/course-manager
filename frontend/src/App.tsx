import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./pages/MainLayout";

export default function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const expires = localStorage.getItem("expires_at");
    if (expires && new Date(expires) < new Date()) {
      localStorage.removeItem("token");
      localStorage.removeItem("expires_at");
      setAuth(false);
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={() => setAuth(true)} />} />
      <Route
        path="/*"
        element={auth ? <MainLayout onLogout={() => { localStorage.clear(); setAuth(false); }} /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}
