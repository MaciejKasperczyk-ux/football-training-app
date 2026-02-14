"use client";

import { useState } from "react";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "trainer" | "viewer">("trainer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setResult({
        type: 'error',
        message: data?.error ? JSON.stringify(data.error) : "Nie udało się utworzyć użytkownika."
      });
      setLoading(false);
      return;
    }

    setResult({
      type: 'success',
      message: `✅ Utworzono: ${data.email} (${data.role})`
    });
    setEmail("");
    setName("");
    setPassword("");
    setRole("trainer");
    setLoading(false);
  }

  return (
    <div className="page-wrap max-w-4xl">
      <div className="hero-card">
        <h1 className="page-title">👥 Zarządzanie użytkownikami</h1>
        <p className="page-subtitle">Tworzenie kont i nadawanie ról dostępowych w systemie</p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Nowy użytkownik</h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Adres e-mail *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Imię i nazwisko *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Jan Kowalski"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Hasło początkowe *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Rola użytkownika *</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "trainer" | "viewer")}
              >
                <option value="trainer">🎯 Trener</option>
                <option value="viewer">👁️ Przeglądający</option>
                <option value="admin">⚙️ Administrator</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              type="submit"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Tworzenie użytkownika...
                </>
              ) : (
                <>✨ Utwórz konto</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`rounded-xl p-5 border-l-4 ${
          result.type === 'success'
            ? 'bg-green-50 border-green-500 text-green-800'
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          <p className="text-sm font-semibold">{result.message}</p>
        </div>
      )}
    </div>
  );
}
