"use client";

import { useEffect, useState } from "react";

type Account = {
  _id: string;
  email: string;
  hasPasswordChanged?: boolean;
  createdAt?: string;
};

export default function PlayerAccountPanel({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/players/${playerId}/account`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError("Nie udalo sie pobrac konta zawodnika.");
      return;
    }

    const nextAccount = data?.account ?? null;
    setAccount(nextAccount);
    setEmail(nextAccount?.email ?? "");
    setError(null);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setTemporaryPassword(null);

    const res = await fetch(`/api/admin/players/${playerId}/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => null);

    setLoading(false);
    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Nie udalo sie zapisac konta zawodnika.");
      return;
    }

    setTemporaryPassword(data?.temporaryPassword ?? null);
    setMessage(data?.mode === "reset" ? "Haslo zawodnika zostalo zresetowane." : "Konto zawodnika zostalo utworzone.");
    await load();
  }

  return (
    <div className="surface p-5">
      <h2 className="section-title">Konto zawodnika</h2>
      <p className="section-copy mt-1">Email, haslo tymczasowe i reset dostepu dla: {playerName}.</p>

      <form onSubmit={submit} className="mt-3 grid gap-3">
        <div className="grid gap-1">
          <label className="field-label">Email do logowania</label>
          <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading || !email.trim()}>
          {loading ? "Zapisywanie..." : account ? "Resetuj haslo i zapisz email" : "Utworz konto zawodnika"}
        </button>
      </form>

      {account ? (
        <div className="mt-3 text-sm text-slate-700">
          Konto istnieje: <span className="font-medium">{account.email}</span>
          {account.createdAt ? ` (od ${new Date(account.createdAt).toLocaleDateString("pl-PL")})` : ""}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-600">Brak konta zawodnika.</div>
      )}

      {temporaryPassword ? (
        <div className="surface-muted mt-3 p-3">
          <div className="text-sm font-semibold text-slate-900">Haslo tymczasowe</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
              {showPassword ? temporaryPassword : "*".repeat(temporaryPassword.length)}
            </code>
            <button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(temporaryPassword)}>
              Kopiuj
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Ukryj" : "Pokaz"}
            </button>
          </div>
        </div>
      ) : null}

      {message ? <div className="mt-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
    </div>
  );
}
