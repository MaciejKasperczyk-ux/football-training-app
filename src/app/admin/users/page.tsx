// src/app/admin/users/page.tsx
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
      setResult(data?.error ? JSON.stringify(data.error) : "Failed");
      setLoading(false);
      return;
    }

    setResult(`Created: ${data.email} role: ${data.role}`);
    setLoading(false);
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Create user</h1>

      <form onSubmit={onSubmit} className="rounded border bg-white p-4 space-y-3">
        <div className="grid gap-1">
          <label className="text-sm">Email</label>
          <input className="rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Name</label>
          <input className="rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Password</label>
          <input className="rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Role</label>
          <select className="rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="trainer">trainer</option>
            <option value="viewer">viewer</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <button disabled={loading} className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60" type="submit">
          {loading ? "Creating" : "Create"}
        </button>

        {result ? <div className="text-sm text-gray-800">{result}</div> : null}
      </form>
    </div>
  );
}
