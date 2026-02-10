"use client";

import { useEffect, useState } from "react";

export default function EditPlayerPanel({ player, playerId }: { player: any; playerId: string }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(player.firstName || "");
  const [lastName, setLastName] = useState(player.lastName || "");
  const [club, setClub] = useState(player.club || "");
  const [position, setPosition] = useState(player.position || "");
  const [birthDate, setBirthDate] = useState<string | undefined>(player.birthDate ? String(new Date(player.birthDate).toISOString().slice(0, 10)) : undefined);
  const [dominantFoot, setDominantFoot] = useState<string | undefined>(player.dominantFoot || undefined);
  const [trainers, setTrainers] = useState<string[]>((player.trainers || []).map((t: any) => String(t._id || t)));
  const [allTrainers, setAllTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<string>("");

  useEffect(() => {
    fetchTrainers();
  }, []);

  async function fetchTrainers() {
    const res = await fetch("/api/admin/trainers");
    if (!res.ok) return;
    const data = await res.json();
    setAllTrainers(data || []);
  }

  function calcAge(bd?: string) {
    if (!bd) return null;
    const d = new Date(bd);
    const diff = Date.now() - d.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        firstName,
        lastName,
        club: club || undefined,
        position: position || undefined,
        birthDate: birthDate || undefined,
        dominantFoot: dominantFoot || undefined,
        trainers,
      };
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ? JSON.stringify(d.error) : "Błąd zapisu");
        setLoading(false);
        return;
      }
      setEditing(false);
      location.reload();
    } catch (e) {
      setError("Błąd zapisu");
    }
    setLoading(false);
  }

  async function addTrainerById(id: string) {
    if (!id) return;
    if (trainers.includes(id)) return;
    setLoading(true);
    try {
      const next = [...trainers, id];
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainers: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ? JSON.stringify(d.error) : "Błąd przypisywania trenera");
        setLoading(false);
        return;
      }
      setTrainers(next);
      setSelectedToAdd("");
    } catch (e) {
      setError("Błąd przypisywania trenera");
    }
    setLoading(false);
  }

  async function removeTrainerById(id: string) {
    if (!id) return;
    setLoading(true);
    try {
      const next = trainers.filter((t) => t !== id);
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainers: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ? JSON.stringify(d.error) : "Błąd usuwania trenera");
        setLoading(false);
        return;
      }
      setTrainers(next);
    } catch (e) {
      setError("Błąd usuwania trenera");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Szczegóły zawodnika</div>
          <div className="text-sm text-gray-600">Edycja podstawowych danych i przypisanie trenerów</div>
        </div>
        <div>
          <button onClick={() => setEditing((v) => !v)} className="rounded border px-3 py-2 text-sm">
            {editing ? "Anuluj" : "Edytuj"}
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="mt-4 grid gap-1 text-sm text-gray-700">
          <div>{firstName} {lastName}</div>
          <div>{club ? `Klub: ${club}` : "Klub: brak"}</div>
          <div>{position ? `Pozycja: ${position}` : "Pozycja: brak"}</div>
          <div>{birthDate ? `Data urodzenia: ${new Date(birthDate).toLocaleDateString("pl-PL")} (wiek: ${calcAge(birthDate)})` : "Data urodzenia: brak"}</div>
          <div>{dominantFoot ? `Lepsza noga: ${dominantFoot === "left" ? "Lewa" : "Prawa"}` : "Lepsza noga: brak"}</div>
          <div>
            Trenerzy: {trainers.length ? (
              <div className="flex flex-wrap gap-2">
                {trainers.map((id) => {
                  const t = allTrainers.find((x) => String(x._id) === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      <span>{t?.name ?? t?.email ?? id}</span>
                      <button onClick={() => removeTrainerById(id)} className="text-red-500">×</button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-gray-500">Brak</span>
            )}

            <div className="mt-2 flex items-center gap-2">
              <select value={selectedToAdd} onChange={(e) => setSelectedToAdd(e.target.value)} className="rounded border px-3 py-2 text-sm">
                <option value="">Wybierz trenera...</option>
                {allTrainers.map((t) => (
                  <option key={t._id} value={String(t._id)}>{t.name ?? t.email}</option>
                ))}
              </select>
              <button onClick={() => addTrainerById(selectedToAdd)} disabled={!selectedToAdd} className="rounded border px-3 py-2 text-sm">Dodaj trenera</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
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
              <input type="date" className="rounded border px-3 py-2" value={birthDate || ""} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Lepsza noga</label>
              <select className="rounded border px-3 py-2" value={dominantFoot || ""} onChange={(e) => setDominantFoot(e.target.value || undefined)}>
                <option value="">Wybierz</option>
                <option value="left">Lewa</option>
                <option value="right">Prawa</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Przypisz trenerów (wielokrotny wybór)</label>
            <select multiple className="rounded border px-3 py-2 h-32" value={trainers} onChange={(e) => setTrainers(Array.from(e.target.selectedOptions, (o) => o.value))}>
              {allTrainers.map((t) => (
                <option key={t._id} value={String(t._id)}>
                  {t.name ?? t.email}
                </option>
              ))}
            </select>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="rounded bg-black px-3 py-2 text-white text-sm">
              {loading ? "Zapis..." : "Zapisz"}
            </button>
            <button onClick={() => setEditing(false)} className="rounded border px-3 py-2 text-sm">Anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}
