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
  const [age, setAge] = useState<string>("");
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
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Dodaj zawodnika</h1>
        <div className="text-sm text-gray-700 mt-1">Uzupełnij podstawowe informacje. Resztę dodasz później.</div>
      </div>

      <form onSubmit={onSubmit} className="rounded border bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Imię</label>
            <input className="rounded border px-3 py-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Nazwisko</label>
            <input className="rounded border px-3 py-2" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Klub</label>
            <input className="rounded border px-3 py-2" value={club} onChange={(e) => setClub(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Pozycja</label>
            <input className="rounded border px-3 py-2" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Data urodzenia</label>
            <input type="date" className="rounded border px-3 py-2" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Lepsza noga</label>
            <select className="rounded border px-3 py-2" value={dominantFoot} onChange={(e) => setDominantFoot(e.target.value)}>
              <option value="">Wybierz</option>
              <option value="left">Lewa</option>
              <option value="right">Prawa</option>
            </select>
          </div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2">
          <button disabled={loading} className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60" type="submit">
            {loading ? "Zapisywanie" : "Zapisz"}
          </button>
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => router.push("/players")}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
