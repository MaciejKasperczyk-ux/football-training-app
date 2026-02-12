"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Training = {
  date: string;
  players?: string[];
  entries?: { skillId: string; detailId?: string }[];
};

type Player = {
  _id: string;
  firstName: string;
  lastName: string;
};

type Skill = {
  _id: string;
  name: string;
  details?: { _id: string; name: string }[];
};

type ReportRow = {
  playerId: string;
  skillId: string;
  detailId?: string;
  learned: boolean;
  notes: string;
};

export default function TrainingDetail() {
  const router = useRouter();
  const routeParams = useParams<{ id?: string }>();
  const id = routeParams?.id ?? "";
  const missingId = !id;

  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playersById, setPlayersById] = useState<Record<string, string>>({});
  const [skillsById, setSkillsById] = useState<Record<string, string>>({});
  const [detailsById, setDetailsById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [trainingRes, playersRes, skillsRes] = await Promise.all([fetch(`/api/trainings/${id}`), fetch("/api/players"), fetch("/api/skills")]);

      if (!trainingRes.ok) {
        setLoadError("Nie udalo sie zaladowac treningu.");
        return;
      }

      const trainingData = await trainingRes.json();
      setTraining(trainingData);
      setLoadError(null);

      if (playersRes.ok) {
        const playersData: Player[] = await playersRes.json();
        const map: Record<string, string> = {};
        for (const player of playersData) {
          map[player._id] = `${player.firstName} ${player.lastName}`;
        }
        setPlayersById(map);
      }

      if (skillsRes.ok) {
        const skillsData: Skill[] = await skillsRes.json();
        const skillMap: Record<string, string> = {};
        const detailMap: Record<string, string> = {};
        for (const skill of skillsData) {
          skillMap[skill._id] = skill.name;
          for (const detail of skill.details ?? []) {
            detailMap[detail._id] = detail.name;
          }
        }
        setSkillsById(skillMap);
        setDetailsById(detailMap);
      }

      const prepared: ReportRow[] = [];
      for (const playerId of trainingData.players ?? []) {
        for (const entry of trainingData.entries ?? []) {
          prepared.push({
            playerId,
            skillId: entry.skillId,
            detailId: entry.detailId ?? undefined,
            learned: false,
            notes: "",
          });
        }
      }
      setReports(prepared);
    }

    load();
  }, [id]);

  function setReport(i: number, patch: Partial<ReportRow>) {
    setReports((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function playerLabel(playerId: string) {
    return playersById[playerId] ?? `ID: ${playerId}`;
  }

  function skillLabel(skillId: string) {
    return skillsById[skillId] ?? `ID: ${skillId}`;
  }

  function detailLabel(detailId?: string) {
    if (!detailId) return "-";
    return detailsById[detailId] ?? `ID: ${detailId}`;
  }

  async function submit() {
    if (!training || !id) return;
    setLoading(true);

    const res = await fetch(`/api/trainings/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reports }),
    });

    setLoading(false);
    if (!res.ok) {
      alert("Nie udalo sie wyslac raportu.");
      return;
    }

    router.push(training.players && training.players.length === 1 ? `/players/${training.players[0]}` : "/trainings");
    router.refresh();
  }

  if (missingId) return <div className="text-sm text-red-600">Brak identyfikatora treningu.</div>;
  if (loadError) return <div className="text-sm text-red-600">{loadError}</div>;
  if (!training) return <div className="text-sm text-slate-600">Ladowanie...</div>;

  const playerNames = (training.players ?? []).map((playerId) => playerLabel(playerId)).join(", ");
  const reportsByPlayer = (training.players ?? []).map((playerId) => ({
    playerId,
    items: reports
      .map((row, idx) => ({ ...row, idx }))
      .filter((row) => row.playerId === playerId),
  }));

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Raport treningu</h1>
        <p className="page-subtitle">Szybka ocena postepu kazdego zawodnika dla kazdego elementu treningowego.</p>
      </div>

      <div className="surface p-5">
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <div>
            <div className="text-slate-500">Data</div>
            <div className="font-medium">{new Date(training.date).toLocaleDateString("pl-PL")}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-slate-500">Zawodnicy</div>
            <div className="font-medium">{playerNames || "-"}</div>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="section-title">Ocena elementow</h2>
            <p className="section-copy">Krotki raport po treningu, podzielony na zawodnikow i elementy.</p>
          </div>
          <span className="pill">{reports.length} pozycji</span>
        </div>

        <div className="grid gap-4">
          {reportsByPlayer.map((group) => (
            <div key={group.playerId} className="surface-muted p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{playerLabel(group.playerId)}</h3>
                <span className="pill">{group.items.length} elementow</span>
              </div>

              <div className="grid gap-3">
                {group.items.map((row) => (
                  <div key={row.idx} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-1 text-sm md:grid-cols-2">
                      <div>
                        <div className="text-slate-500">Umiejetnosc</div>
                        <div className="font-medium">{skillLabel(row.skillId)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Podumiejetnosc</div>
                        <div className="font-medium">{detailLabel(row.detailId)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={row.learned ? "btn btn-primary" : "btn btn-secondary"}
                        onClick={() => setReport(row.idx, { learned: true })}
                      >
                        Opanowane
                      </button>
                      <button
                        type="button"
                        className={!row.learned ? "btn btn-primary" : "btn btn-secondary"}
                        onClick={() => setReport(row.idx, { learned: false })}
                      >
                        Do poprawy
                      </button>
                    </div>

                    <input
                      className="field-input mt-3"
                      placeholder="Notatka trenerska..."
                      value={row.notes}
                      onChange={(e) => setReport(row.idx, { notes: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button disabled={loading} onClick={submit} className="btn btn-primary">
            {loading ? "Wysylanie..." : "Wyslij raport"}
          </button>
        </div>
      </div>
    </div>
  );
}
