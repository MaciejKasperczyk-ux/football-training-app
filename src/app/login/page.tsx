"use client";

import Image from "next/image";
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

    if (res?.error) setError("Błędne dane logowania");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="hero-card mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-white/95 p-3 shadow-md ring-1 ring-slate-200">
              <Image src="/logo.png" alt="Logo Futbolucja" width={112} height={112} className="h-24 w-24 object-contain" priority />
            </div>
          </div>
          <h1 className="page-title text-center">⚽ Futbolucja</h1>
          <p className="page-subtitle text-center mt-2">Zaloguj się do panelu trenera lub zawodnika</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Adres e-mail</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="twoj@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Hasło</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Wpisz swoje hasło"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800">Błąd logowania</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-6"
              type="submit"
            >
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">Hasło jest bezpiecznie przechowywane.</p>
        </div>
      </div>
    </div>
  );
}
