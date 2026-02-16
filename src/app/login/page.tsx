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

    if (res?.error) setError("Błędne dane logowania");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="hero-card mb-6">
          <div className="mb-4 flex justify-center">
            <img src="/logo.png" alt="Logo Futbolucja" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="page-title text-center">⚽ Futbolucja</h1>
          <p className="page-subtitle text-center mt-2">Zaloguj się do panelu trenera lub zawodnika</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Adres e-mail</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="twój@email.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <span className="text-red-600 text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">Błąd logowania</p>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-6"
              type="submit"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Logowanie...
                </>
              ) : (
                <>🔐 Zaloguj się</>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Hasło zostało zaszyfrowane i bezpieczne
          </p>
        </div>
      </div>
    </div>
  );
}
