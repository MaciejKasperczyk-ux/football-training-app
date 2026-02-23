"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
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
      redirect: false,
      callbackUrl: "/",
    });

    if (!res || res.error) {
      setError("Nie udalo sie zalogowac. Sprawdz e-mail i haslo.");
      setLoading(false);
      return;
    }

    router.push(res.url || "/");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-stone-100 p-0 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <div className="relative h-56 w-full">
            <Image
              src="/logo.png"
              alt="Logo Futbolucja"
              fill
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-contain p-4"
              priority
            />
          </div>
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
              <label className="block text-sm font-semibold text-slate-700">Haslo</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Wpisz swoje haslo"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800">Blad logowania</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            ) : null}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center mt-6"
              type="submit"
            >
              {loading ? "Logowanie..." : "Zaloguj sie"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
