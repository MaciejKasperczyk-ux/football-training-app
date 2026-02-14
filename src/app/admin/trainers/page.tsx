"use client";

import { useEffect, useState } from "react";

interface Trainer {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchTrainers() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/trainers");
    const data = await res.json();

    if (!res.ok) {
      setError("Nie udało się pobrać trenerów.");
      setLoading(false);
      return;
    }

    setTrainers(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrainers();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setTemporaryPassword(null);

    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Nie udało się utworzyć trenera.");
      setSubmitting(false);
      return;
    }

    setTemporaryPassword(data.temporaryPassword);
    setFirstName("");
    setLastName("");
    setEmail("");
    setSubmitting(false);
    await fetchTrainers();
  }

  async function deleteTrainer(id: string) {
    if (!confirm("Czy na pewno usunac tego trenera?")) return;

    const res = await fetch(`/api/admin/trainers/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("Nie udało się usunąć trenera.");
      return;
    }

    await fetchTrainers();
  }

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">🏋️ Zarządzanie trenerami</h1>
        <p className="page-subtitle">Dodawanie kont trenerskich, generowanie haseł i zarządzanie dostępem</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add New Trainer Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">➕ Nowy trener</h2>
            <p className="text-sm text-slate-600 mt-1">Utwórz konto i wygeneruj hasło tymczasowe</p>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {/* First Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Imię *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jan"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Nazwisko *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Kowalski"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Adres e-mail *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.kowalski@example.com"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-6"
              type="submit"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Tworzenie trenera...
                </>
              ) : (
                <>✨ Utwórz trenera</>
              )}
            </button>
          </form>

          {/* Temporary Password Display */}
          {temporaryPassword && (
            <div className="p-6 border-t border-slate-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900 mb-3">🔑 Hasło tymczasowe wygenerowane:</p>
              <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-3">
                <code className="block bg-slate-900 text-white p-3 rounded text-sm font-mono break-all">
                  {showPassword ? temporaryPassword : "•".repeat(temporaryPassword.length)}
                </code>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(temporaryPassword);
                      alert("Hasło skopiowane do schowka!");
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    📋 Kopiuj
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {showPassword ? "🙈 Ukryj" : "👁️ Pokaż"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-6 border-t border-slate-200 bg-red-50">
              <div className="flex gap-3">
                <span className="text-red-600 text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">Błąd</p>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trainers List Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">📋 Lista trenerów</h2>
            <p className="text-sm text-slate-600 mt-1">Aktywne konta trenerskie w systemie</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-600 animate-pulse">⏳ Ładowanie trenerów...</p>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">😴 Brak trenerów w systemie</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {trainers.map((trainer) => (
                  <div
                    key={trainer._id}
                    className="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{trainer.name}</div>
                      <div className="text-sm text-slate-600 truncate">{trainer.email}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        📅 {new Date(trainer.createdAt).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTrainer(trainer._id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition whitespace-nowrap"
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
