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
      setError("Nie udalo sie pobrac trenerow.");
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
      setError(data?.error ? JSON.stringify(data.error) : "Nie udalo sie utworzyc trenera.");
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
      setError("Nie udalo sie usunac trenera.");
      return;
    }

    await fetchTrainers();
  }

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Trenerzy</h1>
        <p className="page-subtitle">Dodawanie kont trenerskich i zarzadzanie dostepem.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface space-y-4 p-5">
          <div>
            <h2 className="section-title">Nowy trener</h2>
            <p className="section-copy">Utworz konto i wygeneruj haslo tymczasowe.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-1">
              <label className="field-label">Imie</label>
              <input className="field-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>

            <div className="grid gap-1">
              <label className="field-label">Nazwisko</label>
              <input className="field-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>

            <div className="grid gap-1">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <button disabled={submitting} className="btn btn-primary" type="submit">
              {submitting ? "Tworzenie..." : "Utworz trenera"}
            </button>
          </form>

          {temporaryPassword && (
            <div className="surface-muted p-3">
              <p className="text-sm font-semibold text-slate-800">Haslo tymczasowe:</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
                  {showPassword ? temporaryPassword : "•".repeat(temporaryPassword.length)}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(temporaryPassword);
                  }}
                  className="btn btn-secondary"
                >
                  Kopiuj
                </button>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn btn-secondary">
                  {showPassword ? "Ukryj" : "Pokaz"}
                </button>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-700">{error}</div>}
        </div>

        <div className="surface p-5">
          <div className="mb-3">
            <h2 className="section-title">Lista trenerow</h2>
            <p className="section-copy">Aktywne konta trenerskie.</p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Ladowanie...</p>
          ) : trainers.length === 0 ? (
            <p className="text-sm text-slate-600">Brak trenerow.</p>
          ) : (
            <div className="grid gap-2">
              {trainers.map((trainer) => (
                <div key={trainer._id} className="surface-muted flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{trainer.name}</div>
                    <div className="truncate text-xs text-slate-600">{trainer.email}</div>
                    <div className="text-xs text-slate-500">{new Date(trainer.createdAt).toLocaleDateString("pl-PL")}</div>
                  </div>
                  <button onClick={() => deleteTrainer(trainer._id)} className="btn btn-danger">
                    Usun
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
