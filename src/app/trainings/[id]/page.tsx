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

      const data = await trainingRes.json();
      setTraining(data);
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
      for (const playerId of data.players ?? []) {
        for (const entry of data.entries ?? []) {
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

  function setReport(i: number, key: keyof ReportRow, value: string | boolean | undefined) {
    setReports((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  }

  function playerLabel(playerId: string) {
    return playersById[playerId] ?? `ID: ${playerId}`;
  }

  function skillLabel(skillId: string) {
    return skillsById[skillId] ?? `ID: ${skillId}`;
  }

  function detailLabel(detailId?: string) {
    if (!detailId) return null;
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
  if (!training) return <div>Ladowanie...</div>;

  const playerNames = (training.players ?? []).map((playerId) => playerLabel(playerId)).join(", ");

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Szczegoly treningu</h1>

      <div className="rounded border bg-white p-4">
        <div className="text-sm">Data: {new Date(training.date).toLocaleDateString("pl-PL")}</div>
        <div className="text-sm">Zawodnicy: {playerNames || "-"}</div>
        <div className="text-sm">Elementow: {(training.entries || []).length}</div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="font-medium">Raport - zaznacz czy zawodnik sie nauczyl</div>
        <div className="mt-3 grid gap-3">
          {reports.map((row, i) => (
            <div key={i} className="rounded border p-3">
              <div className="grid gap-1 text-sm md:grid-cols-3">
                <div>Zawodnik: <span className="font-medium">{playerLabel(row.playerId)}</span></div>
                <div>Umiejetnosc: <span className="font-medium">{skillLabel(row.skillId)}</span></div>
                <div>Podumiejetnosc: <span className="font-medium">{detailLabel(row.detailId) ?? "-"}</span></div>
              </div>
              <div className="mt-3 flex items-center gap-3">
              <label className="text-sm">
                <input type="checkbox" checked={row.learned} onChange={(e) => setReport(i, "learned", e.target.checked)} /> Nauczony
              </label>
              <input className="ml-auto rounded border px-2 py-1" placeholder="Notatka" value={row.notes} onChange={(e) => setReport(i, "notes", e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button disabled={loading} onClick={submit} className="rounded bg-black px-3 py-2 text-white">
            {loading ? "Wysylanie..." : "Wyslij raport"}
          </button>
        </div>
      </div>
    </div>
  );
}
