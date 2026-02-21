"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Player = {
  _id: string;
  firstName: string;
  lastName: string;
  club?: string;
  position?: string;
};

type Skill = { _id: string; name: string; details: { _id: string; name: string; difficulty?: 1 | 2 | 3 }[] };
type Trainer = { _id: string; name?: string; email?: string };

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
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playerQuery, setPlayerQuery] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(prePlayerId ? [prePlayerId] : []);

  const [trainerId, setTrainerId] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Entry[]>([{ skillId: "" }]);

  useEffect(() => {
    async function load() {
      try {
        const [playersRes, skillsRes, trainersRes] = await Promise.all([
          fetch("/api/players"),
          fetch("/api/skills"),
          fetch("/api/admin/trainers"),
        ]);

        const playersData: Player[] = await playersRes.json();
        const skillsData: Skill[] = await skillsRes.json();
        const trainersData: Trainer[] = await trainersRes.json().catch(() => []);

        setPlayers(playersData);
        setSkills(skillsData);
        setTrainers(trainersData);
      } finally {
        setInitialLoading(false);
      }
    }

    load();
  }, []);

  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    for (const player of players) {
      map.set(player._id, player);
    }
    return map;
  }, [players]);

  const selectedPlayerItems = useMemo(
    () => selectedPlayers.map((id) => playersById.get(id)).filter((player): player is Player => Boolean(player)),
    [playersById, selectedPlayers]
  );

  const clubs = useMemo(() => {
    return Array.from(new Set(players.map((player) => (player.club ?? "").trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "pl")
    );
  }, [players]);

  const availablePlayers = useMemo(() => {
    const query = playerQuery.trim().toLowerCase();

    let list = players.filter((player) => !selectedPlayers.includes(player._id));

    if (clubFilter) {
      list = list.filter((player) => (player.club ?? "") === clubFilter);
    }

    if (query.length > 0) {
      list = list.filter((player) => {
        const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
        const club = (player.club ?? "").toLowerCase();
        const position = (player.position ?? "").toLowerCase();
        return fullName.includes(query) || club.includes(query) || position.includes(query);
      });

      list.sort((a, b) => {
        const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
        const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
        const aStarts = aName.startsWith(query) ? 0 : 1;
        const bStarts = bName.startsWith(query) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aName.localeCompare(bName, "pl");
      });
    } else {
      list.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "pl"));
    }

    return list.slice(0, 14);
  }, [clubFilter, playerQuery, players, selectedPlayers]);

  const showPlayerResults = playerQuery.trim().length >= 2 || Boolean(clubFilter);
  const validEntriesCount = entries.filter((entry) => entry.skillId).length;

  function togglePlayer(playerId: string) {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  }

  function clearSelectedPlayers() {
    setSelectedPlayers([]);
  }

  function addEntry() {
    setEntries((prev) => [...prev, { skillId: "" }]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function setEntry(index: number, key: keyof Entry, value: string) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));
  }

  function getDetails(skillIdValue: string) {
    const skill = skills.find((item) => item._id === skillIdValue);
    return skill?.details ?? [];
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
        volume: entry.volume ? Number(entry.volume) : undefined,
        quality: entry.quality ? Number(entry.quality) : undefined,
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

  if (initialLoading) {
    return (
      <div className="page-wrap max-w-7xl mx-auto w-full">
        <div className="hero-card">
          <h1 className="page-title">Nowy trening</h1>
          <p className="page-subtitle">Ladowanie formularza...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap max-w-7xl mx-auto w-full">
      <div className="hero-card">
        <h1 className="page-title">Nowy trening</h1>
        <p className="page-subtitle">Szybki formularz pod duza liczbe zawodnikow: szukaj, dodawaj i zapisuj bez przewijania dlugich list.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <section className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title">1. Uczestnicy</h2>
              <div className="flex items-center gap-2">
                <span className="pill">Wybranych: {selectedPlayers.length}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearSelectedPlayers}
                  disabled={selectedPlayers.length === 0}
                >
                  Wyczysc
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px]">
              <div className="grid gap-1">
                <label className="field-label">Wyszukaj zawodnika</label>
                <input
                  className="field-input"
                  placeholder="Wpisz min. 2 znaki: imie, nazwisko, klub, pozycja"
                  value={playerQuery}
                  onChange={(event) => setPlayerQuery(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="field-label">Filtr klubu</label>
                <select className="field-select" value={clubFilter} onChange={(event) => setClubFilter(event.target.value)}>
                  <option value="">Wszystkie kluby</option>
                  {clubs.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {!showPlayerResults ? (
                <div className="text-sm text-slate-600">Aby szybko znalezc zawodnika, wpisz co najmniej 2 znaki lub wybierz klub.</div>
              ) : availablePlayers.length === 0 ? (
                <div className="text-sm text-slate-600">Brak wynikow dla podanych filtrow.</div>
              ) : (
                <div className="grid gap-2">
                  {availablePlayers.map((player) => {
                    const fullName = `${player.firstName} ${player.lastName}`;
                    return (
                      <button
                        key={player._id}
                        type="button"
                        onClick={() => togglePlayer(player._id)}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-sky-300 hover:bg-sky-50"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{fullName}</div>
                          <div className="text-xs text-slate-500">{player.club || "Bez klubu"} {player.position ? `- ${player.position}` : ""}</div>
                        </div>
                        <span className="btn btn-secondary !py-1 !px-2 text-xs">Dodaj</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="field-label mb-2">Wybrani zawodnicy</div>
              {selectedPlayerItems.length === 0 ? (
                <div className="text-sm text-slate-600">Brak wybranych zawodnikow.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedPlayerItems.map((player) => {
                    const fullName = `${player.firstName} ${player.lastName}`;
                    return (
                      <button
                        key={player._id}
                        type="button"
                        onClick={() => togglePlayer(player._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100"
                      >
                        {fullName}
                        <span className="text-sky-700">x</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="surface p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title">2. Elementy treningu</h2>
              <button type="button" className="btn btn-secondary" onClick={addEntry}>
                Dodaj element
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {entries.map((entry, index) => (
                <div key={index} className="surface-muted p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">Element {index + 1}</div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-40"
                      onClick={() => removeEntry(index)}
                      disabled={entries.length === 1}
                    >
                      Usun
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1">
                      <label className="field-label">Umiejetnosc</label>
                      <select
                        className="field-select"
                        value={entry.skillId}
                        onChange={(event) => {
                          const nextSkillId = event.target.value;
                          setEntry(index, "skillId", nextSkillId);
                          setEntry(index, "detailId", "");
                        }}
                      >
                        <option value="">Wybierz umiejetnosc</option>
                        {skills.map((skill) => (
                          <option key={skill._id} value={skill._id}>
                            {skill.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-1">
                      <label className="field-label">Podumiejetnosc</label>
                      <select
                        className="field-select"
                        value={entry.detailId ?? ""}
                        onChange={(event) => setEntry(index, "detailId", event.target.value)}
                        disabled={!entry.skillId}
                      >
                        <option value="">Brak</option>
                        {getDetails(entry.skillId).map((detail) => (
                          <option key={detail._id} value={detail._id}>
                            {`[P${detail.difficulty ?? 1}] ${detail.name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1">
                      <label className="field-label">Ilosc powtorzen (opcjonalnie)</label>
                      <input
                        type="number"
                        min={1}
                        className="field-input"
                        value={entry.volume ?? ""}
                        onChange={(event) => setEntry(index, "volume", event.target.value)}
                        placeholder="np. 12"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="field-label">Ocena jakosci 1-5 (opcjonalnie)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="field-input"
                        value={entry.quality ?? ""}
                        onChange={(event) => setEntry(index, "quality", event.target.value)}
                        placeholder="np. 4"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1">
                    <label className="field-label">Notatka</label>
                    <input
                      className="field-input"
                      value={entry.notes ?? ""}
                      onChange={(event) => setEntry(index, "notes", event.target.value)}
                      placeholder="np. nacisk na pierwszy kontakt i orientacje"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="surface p-5">
            <h2 className="section-title">3. Parametry sesji</h2>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-1">
                <label className="field-label">Data treningu</label>
                <input className="field-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>

              <div className="grid gap-1">
                <label className="field-label">Przypisany trener (opcjonalnie)</label>
                <select className="field-select" value={trainerId} onChange={(event) => setTrainerId(event.target.value)}>
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

          <section className="surface p-5">
            <h2 className="section-title">Podsumowanie</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Zawodnicy</span>
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

            {selectedPlayers.length === 0 ? (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Wybierz przynajmniej jednego zawodnika.</div>
            ) : null}
            {validEntriesCount === 0 ? (
              <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">Dodaj co najmniej jedna umiejetnosc.</div>
            ) : null}
            {error ? <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

            <button
              disabled={loading || selectedPlayers.length === 0}
              className="btn btn-primary mt-4 w-full"
              type="submit"
            >
              {loading ? "Zapisywanie..." : "Zapisz trening"}
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}
