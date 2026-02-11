// src/app/trainings/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Player = { _id: string; firstName: string; lastName: string };
type Skill = { _id: string; name: string; details: { _id: string; name: string }[] };

type Entry = {
  skillId: string;
  detailId?: string;
  notes?: string;
};

export default function NewTrainingPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const prePlayerId = sp.get("playerId") ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(prePlayerId ? [prePlayerId] : []);
  const [trainers, setTrainers] = useState<{ _id: string; name?: string; email?: string }[]>([]);
  const [trainerId, setTrainerId] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Entry[]>([{ skillId: "" }]);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, sRes, trRes] = await Promise.all([fetch("/api/players"), fetch("/api/skills"), fetch("/api/admin/trainers")]);
        const p = await pRes.json();
        const s = await sRes.json();
        const tr = await trRes.json().catch(() => []);
        setPlayers(p);
        setSkills(s);
        setTrainers(tr);
      } finally {
        setInitialLoading(false);
      }
    }
    load();
  }, []);

  function setEntry(i: number, key: keyof Entry, value: string) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, { skillId: "" }]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayers((prev) => (prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEntries = entries
      .filter((entry) => entry.skillId)
      .map((entry) => ({
        skillId: entry.skillId,
        detailId: entry.detailId || undefined,
        notes: entry.notes || undefined,
      }));

    const res = await fetch("/api/trainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        players: selectedPlayers,
        trainerId: trainerId || undefined,
        date,
        entries: cleanEntries.length ? cleanEntries : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ? JSON.stringify(data.error) : "Nie udalo sie zapisac treningu.");
      setLoading(false);
      return;
    }

    router.push(selectedPlayers.length === 1 ? `/players/${selectedPlayers[0]}` : "/trainings");
    router.refresh();
  }

  function getDetails(skillIdValue: string) {
    const skill = skills.find((s) => s._id === skillIdValue);
    return skill?.details ?? [];
  }

  function getSkillName(id: string) {
    return skills.find((s) => s._id === id)?.name ?? "";
  }

  const filteredPlayers = players.filter((player) =>
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(playerQuery.toLowerCase().trim())
  );

  const selectedPlayerNames = players
    .filter((player) => selectedPlayers.includes(player._id))
    .map((player) => `${player.firstName} ${player.lastName}`);

  const validEntriesCount = entries.filter((entry) => entry.skillId).length;

  if (initialLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold">Nowy trening</h1>
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">Ladowanie formularza...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Nowy trening</h1>
        <p className="mt-2 text-sm text-slate-200">Wybierz zawodnikow, ustaw date i szybko dodaj elementy treningowe.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">1. Uczestnicy</h2>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{selectedPlayers.length} wybranych</span>
          </div>

          <div className="mt-3 grid gap-2">
            <input
              className="rounded-lg border px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-900"
              placeholder="Szukaj zawodnika..."
              value={playerQuery}
              onChange={(e) => setPlayerQuery(e.target.value)}
            />
            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border bg-slate-50 p-2">
              {filteredPlayers.length === 0 ? (
                <div className="px-2 py-3 text-sm text-slate-500">Brak zawodnikow pasujacych do wyszukiwania.</div>
              ) : (
                filteredPlayers.map((player) => {
                  const fullName = `${player.firstName} ${player.lastName}`;
                  const checked = selectedPlayers.includes(player._id);
                  return (
                    <label key={player._id} className="flex cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2 text-sm hover:border-slate-300">
                      <input type="checkbox" checked={checked} onChange={() => togglePlayer(player._id)} />
                      <span className="font-medium text-slate-800">{fullName}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {selectedPlayerNames.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedPlayerNames.map((name) => (
                <span key={name} className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                  {name}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">2. Parametry</h2>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-slate-700">Data treningu</label>
              <input
                className="rounded-lg border px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-900"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium text-slate-700">Przypisany trener (opcjonalnie)</label>
              <select
                className="rounded-lg border px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-900"
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
              >
                <option value="">Bez przypisania</option>
                {trainers.map((trainer) => (
                  <option key={trainer._id} value={trainer._id}>
                    {trainer.name ?? trainer.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">3. Elementy treningu</h2>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
              onClick={addEntry}
            >
              Dodaj element
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {entries.map((entry, i) => (
              <div key={i} className="rounded-xl border bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Element {i + 1}</span>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
                    onClick={() => removeEntry(i)}
                    disabled={entries.length === 1}
                  >
                    Usun
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-slate-700">Umiejetnosc</label>
                    <input
                      list={`skills-list-${i}`}
                      className="rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-900"
                      value={getSkillName(entry.skillId)}
                      onChange={(e) => {
                        const found = skills.find((skill) => skill.name === e.target.value);
                        setEntry(i, "skillId", found ? found._id : "");
                        if (!found) setEntry(i, "detailId", "");
                      }}
                      placeholder="Wybierz z listy"
                    />
                    <datalist id={`skills-list-${i}`}>
                      {skills.map((skill) => (
                        <option key={skill._id} value={skill.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-slate-700">Podumiejetnosc</label>
                    <select
                      className="rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-900"
                      value={entry.detailId ?? ""}
                      onChange={(e) => setEntry(i, "detailId", e.target.value)}
                      disabled={!entry.skillId}
                    >
                      <option value="">Wybierz</option>
                      {getDetails(entry.skillId).map((detail) => (
                        <option key={detail._id} value={detail._id}>
                          {detail.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid gap-1">
                  <label className="text-sm font-medium text-slate-700">Notatka</label>
                  <input
                    className="rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-900"
                    value={entry.notes ?? ""}
                    onChange={(e) => setEntry(i, "notes", e.target.value)}
                    placeholder="np. nacisk na pierwszy kontakt z pilka"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Podsumowanie</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Wybrani zawodnicy</span>
              <strong>{selectedPlayers.length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Elementy z umiejetnoscia</span>
              <strong>{validEntriesCount}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Data</span>
              <strong>{date || "-"}</strong>
            </div>
          </div>

          {selectedPlayers.length === 0 ? <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Wybierz przynajmniej jednego zawodnika.</div> : null}
          {validEntriesCount === 0 ? (
            <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">Dodaj co najmniej jedna umiejetnosc w elementach treningu.</div>
          ) : null}
          {error ? <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <div className="mt-4 flex gap-2">
            <button
              disabled={loading || selectedPlayers.length === 0}
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
            >
              {loading ? "Zapisywanie..." : "Zapisz trening"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
