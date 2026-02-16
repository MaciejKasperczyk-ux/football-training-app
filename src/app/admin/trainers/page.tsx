"use client";

import { useEffect, useState } from "react";

interface Trainer {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  club?: string;
  yearGroup?: string;
  role: string;
  createdAt: string;
}

function getErrorMessage(raw: unknown): string {
  if (!raw) return "Nie udało się wykonać operacji.";
  if (typeof raw === "string") return raw;
  return JSON.stringify(raw);
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
  const [phone, setPhone] = useState("");
  const [club, setClub] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchTrainers() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/trainers");
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError("Nie udało się pobrać trenerów.");
      setLoading(false);
      return;
    }

    setTrainers(Array.isArray(data) ? data : []);
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
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        phone,
        club,
        yearGroup,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(getErrorMessage(data?.error) || "Nie udało się utworzyć trenera.");
      setSubmitting(false);
      return;
    }

    setTemporaryPassword(data?.temporaryPassword ?? null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setClub("");
    setYearGroup("");
    setSubmitting(false);
    await fetchTrainers();
  }

  async function deleteTrainer(id: string) {
    if (!confirm("Czy na pewno usunąć tego trenera?")) return;

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
        <h1 className="page-title">Zarządzanie trenerami</h1>
        <p className="page-subtitle">Baza trenerów: dane kontaktowe, klub i rocznik prowadzonej grupy.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Nowy trener</h2>
            <p className="text-sm text-slate-600 mt-1">Utwórz konto i pełną kartę kontaktową trenera.</p>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Telefon *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="np. +48 600 700 800"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Klub *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="np. KS Przykład"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Rocznik prowadzonej grupy *</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                value={yearGroup}
                onChange={(e) => setYearGroup(e.target.value)}
                placeholder="np. 2013"
                required
              />
            </div>

            <button
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-6"
              type="submit"
            >
              {submitting ? "Tworzenie trenera..." : "Utwórz trenera"}
            </button>
          </form>

          {temporaryPassword && (
            <div className="p-6 border-t border-slate-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900 mb-3">Hasło tymczasowe wygenerowane:</p>
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
                    Kopiuj
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {showPassword ? "Ukryj" : "Pokaż"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6 border-t border-slate-200 bg-red-50">
              <p className="text-sm font-semibold text-red-800">Błąd</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Lista trenerów</h2>
            <p className="text-sm text-slate-600 mt-1">Kliknij e-mail, aby od razu otworzyć okno wiadomości.</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-600 animate-pulse">Ładowanie trenerów...</p>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">Brak trenerów w systemie</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[34rem] overflow-y-auto">
                {trainers.map((trainer) => (
                  <div key={trainer._id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-semibold text-slate-800 truncate">{trainer.name}</div>
                        <a
                          href={`mailto:${trainer.email}`}
                          className="block text-sm text-blue-700 hover:text-blue-900 hover:underline truncate"
                          title="Wyślij e-mail"
                        >
                          {trainer.email}
                        </a>
                        <a
                          href={`tel:${(trainer.phone ?? "").replace(/\s+/g, "")}`}
                          className="block text-sm text-slate-700 hover:text-slate-900 hover:underline"
                          title="Zadzwoń"
                        >
                          {trainer.phone ?? "Brak telefonu"}
                        </a>
                        <div className="text-sm text-slate-700">Klub: {trainer.club ?? "-"}</div>
                        <div className="text-sm text-slate-700">Rocznik: {trainer.yearGroup ?? "-"}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Dodano: {new Date(trainer.createdAt).toLocaleDateString("pl-PL")}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTrainer(trainer._id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition whitespace-nowrap"
                      >
                        Usuń
                      </button>
                    </div>
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
