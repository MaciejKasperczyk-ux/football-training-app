"use client";

import { useState } from "react";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "trainer" | "viewer">("trainer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
      setResult(data?.error ? JSON.stringify(data.error) : "Nie udalo sie utworzyc uzytkownika.");
      setLoading(false);
      return;
    }

    setResult(`Utworzono: ${data.email} (${data.role})`);
    setLoading(false);
  }

  return (
    <div className="page-wrap max-w-3xl">
      <div className="hero-card">
        <h1 className="page-title">Admin - uzytkownicy</h1>
        <p className="page-subtitle">Tworzenie kont i nadawanie ról dostepowych.</p>
      </div>

      <form onSubmit={onSubmit} className="surface space-y-3 p-5">
        <div className="grid gap-1">
          <label className="field-label">Email</label>
          <input className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="grid gap-1">
          <label className="field-label">Nazwa</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid gap-1">
          <label className="field-label">Haslo</label>
          <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="grid gap-1">
          <label className="field-label">Rola</label>
          <select className="field-select" value={role} onChange={(e) => setRole(e.target.value as "admin" | "trainer" | "viewer")}>
            <option value="trainer">trener</option>
            <option value="viewer">podglad</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? "Tworzenie..." : "Utworz konto"}
          </button>
        </div>

        {result ? <div className="text-sm text-slate-700">{result}</div> : null}
      </form>
    </div>
  );
}
