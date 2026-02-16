"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [club, setClub] = useState("");
  const [position, setPosition] = useState("");
  const [age] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [dominantFoot, setDominantFoot] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        club: club || undefined,
        position: position || undefined,
        age: age ? Number(age) : undefined,
        birthDate: birthDate || undefined,
        dominantFoot: dominantFoot || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ? JSON.stringify(data.error) : "Nie udało się dodać zawodnika");
      setLoading(false);
      return;
    }

    router.push("/players");
    router.refresh();
  }

  return (
    <div className="page-wrap max-w-3xl mx-auto w-full">
      <div className="hero-card">
        <h1 className="page-title">Nowy zawodnik</h1>
        <p className="page-subtitle">Wypelnij podstawowe informacje. Szczegoly treningowe dodasz pozniej.</p>
      </div>

      <form onSubmit={onSubmit} className="surface space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="field-label">Imie</label>
            <input className="field-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="field-label">Nazwisko</label>
            <input className="field-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Klub</label>
            <input className="field-input" value={club} onChange={(e) => setClub(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Pozycja</label>
            <input className="field-input" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Data urodzenia</label>
            <input type="date" className="field-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Lepsza noga</label>
            <select className="field-select" value={dominantFoot} onChange={(e) => setDominantFoot(e.target.value)}>
              <option value="">Wybierz</option>
              <option value="left">Lewa</option>
              <option value="right">Prawa</option>
            </select>
          </div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2">
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? "Zapisywanie" : "Zapisz"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/players")}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
