"use client";

import { useState, useEffect } from "react";

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

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  async function fetchTrainers() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/trainers");
    const data = await res.json();

    if (!res.ok) {
      setError("Failed to fetch trainers");
      setLoading(false);
      return;
    }

    setTrainers(data);
    setLoading(false);
  }

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
      setError(data?.error ? JSON.stringify(data.error) : "Failed to create trainer");
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
    if (!confirm("Czy na pewno chcesz usunąć tego trenera?")) return;

    const res = await fetch(`/api/admin/trainers/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("Failed to delete trainer");
      return;
    }

    await fetchTrainers();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-semibold">Zarządzanie trenerami</h1>

      {/* Create Trainer Form */}
      <div className="rounded border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">Dodaj nowego trenera</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm">Imię</label>
            <input
              className="rounded border px-3 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Nazwisko</label>
            <input
              className="rounded border px-3 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Email</label>
            <input
              className="rounded border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            disabled={submitting}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            type="submit"
          >
            {submitting ? "Tworzenie..." : "Utwórz trenera"}
          </button>
        </form>

        {temporaryPassword && (
          <div className="rounded bg-green-50 border border-green-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-green-900">Trener został utworzony! Hasło tymczasowe:</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-green-100 px-3 py-2 font-mono text-sm select-all">
                {showPassword ? temporaryPassword : "•".repeat(temporaryPassword.length)}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(temporaryPassword);
                  alert("Hasło skopiowane!");
                }}
                className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
              >
                Kopiuj
              </button>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
              >
                {showPassword ? "Ukryj" : "Pokaż"}
              </button>
            </div>
          </div>
        )}

        {error && <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-900">{error}</div>}
      </div>

      {/* Trainers List */}
      <div className="rounded border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">Lista trenerów</h2>
        {loading ? (
          <p className="text-slate-600">Ładowanie...</p>
        ) : trainers.length === 0 ? (
          <p className="text-slate-600">Brak trenerów</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2">Imię i Nazwisko</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Utworzony</th>
                  <th className="text-left px-4 py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((trainer) => (
                  <tr key={trainer._id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2">{trainer.name}</td>
                    <td className="px-4 py-2">{trainer.email}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">
                      {new Date(trainer.createdAt).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteTrainer(trainer._id)}
                        className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
