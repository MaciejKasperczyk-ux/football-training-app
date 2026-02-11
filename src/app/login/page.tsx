"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/",
    });

    if ((res as any)?.error) setError("Bledne dane logowania");
    setLoading(false);
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="hero-card">
          <h1 className="page-title">Logowanie</h1>
          <p className="page-subtitle">Zaloguj sie do panelu trenera.</p>
        </div>

        <form onSubmit={onSubmit} className="surface space-y-3 p-5">
          <div className="space-y-1">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="field-label">Haslo</label>
            <input
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button disabled={loading} className="btn btn-primary w-full" type="submit">
            {loading ? "Logowanie..." : "Zaloguj sie"}
          </button>
        </form>
      </div>
    </div>
  );
}
