// src/app/trainings/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Player = { _id: string; firstName: string; lastName: string };
type Skill = { _id: string; name: string; details: { _id: string; name: string }[] };

type Entry = {
  skillId: string;
  detailId?: string;
  volume?: string;
  quality?: string;
  notes?: string;
};

export default function NewTrainingPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const prePlayerId = sp.get("playerId") ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(prePlayerId ? [prePlayerId] : []);
  const [trainers, setTrainers] = useState<{ _id: string; name?: string; email?: string }[]>([]);
  const [trainerId, setTrainerId] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Entry[]>([{ skillId: "" }]);

  useEffect(() => {
    async function load() {
      const [pRes, sRes, trRes] = await Promise.all([fetch("/api/players"), fetch("/api/skills"), fetch("/api/admin/trainers")]);
      const p = await pRes.json();
      const s = await sRes.json();
      const tr = await trRes.json().catch(() => []);
      setPlayers(p);
      setSkills(s);
      setTrainers(tr);
    }
    load();
  }, []);

  function setEntry(i: number, key: keyof Entry, value: string) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, { skillId: "" }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEntries = entries.filter((e) => e.skillId).map((e) => ({ skillId: e.skillId, detailId: e.detailId || undefined, notes: e.notes || undefined }));

    const res = await fetch("/api/trainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: selectedPlayers, trainerId: trainerId || undefined, date, entries: cleanEntries.length ? cleanEntries : undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ? JSON.stringify(data.error) : "Failed");
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

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Nowy trening</h1>

      <form onSubmit={onSubmit} className="rounded border bg-white p-4 space-y-4">
          <div className="grid gap-1">
            <label className="text-sm">Zawodnicy (Ctrl/Cmd aby wybrać wiele)</label>
            <select
              multiple
              className="rounded border px-3 py-2"
              value={selectedPlayers}
              onChange={(e) => {
                const opts = Array.from(e.currentTarget.options);
                const vals = opts.filter((o) => o.selected).map((o) => o.value);
                setSelectedPlayers(vals);
              }}
            >
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Data</label>
            <input className="rounded border px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

        <div className="grid gap-1">
          <label className="text-sm">Przypisany trener (opcjonalne)</label>
          <select className="rounded border px-3 py-2" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            <option value="">(brak)</option>
            {trainers.map((t) => (
              <option key={t._id} value={t._id}>{t.name ?? t.email}</option>
            ))}
          </select>
        </div>
        

        <div className="space-y-2">
          <div className="font-medium text-sm">Elementy</div>

          {entries.map((en, i) => (
            <div key={i} className="rounded border p-3 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Umiejętność</label>
                  <input
                    list={`skills-list-${i}`}
                    className="rounded border px-3 py-2"
                    value={getSkillName(en.skillId)}
                    onChange={(e) => {
                      const name = e.target.value;
                      const found = skills.find((s) => s.name === name);
                      setEntry(i, "skillId", found ? found._id : "");
                    }}
                  />
                  <datalist id={`skills-list-${i}`}>
                    {skills.map((s) => (
                      <option key={s._id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid gap-1">
                  <label className="text-sm">Podumiejętność</label>
                  <select
                    className="rounded border px-3 py-2"
                    value={en.detailId ?? ""}
                    onChange={(e) => setEntry(i, "detailId", e.target.value)}
                    disabled={!en.skillId}
                  >
                    <option value="">Wybierz</option>
                    {getDetails(en.skillId).map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* ilość i jakość usunięte — upraszczamy UI */}
              </div>

              <div className="grid gap-1">
                <label className="text-sm">Notatka</label>
                <input className="rounded border px-3 py-2" value={en.notes ?? ""} onChange={(e) => setEntry(i, "notes", e.target.value)} />
              </div>
            </div>
          ))}

          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={addEntry}>
            Dodaj element
          </button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button disabled={loading} className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60" type="submit">
          {loading ? "Zapisuję..." : "Zapisz"}
        </button>
      </form>
    </div>
  );
}
