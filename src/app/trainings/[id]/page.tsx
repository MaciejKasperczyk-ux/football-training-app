"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Training = any;

export default function TrainingDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/trainings/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setTraining(data);

      // prepare empty reports per player x entry
      const r: any[] = [];
      for (const p of data.players ?? []) {
        for (const e of data.entries ?? []) {
          r.push({ playerId: p, skillId: e.skillId, detailId: e.detailId ?? undefined, learned: false, notes: "" });
        }
      }
      setReports(r);
    }
    load();
  }, [id]);

  function setReport(i: number, key: string, value: any) {
    setReports((prev) => prev.map((x, idx) => (idx === i ? { ...x, [key]: value } : x)));
  }

  async function submit() {
    if (!training) return;
    setLoading(true);
    const res = await fetch(`/api/trainings/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reports }),
    });
    setLoading(false);
    if (!res.ok) {
      alert("Nie udało się wysłać raportu");
      return;
    }
    router.push(training.players && training.players.length === 1 ? `/players/${training.players[0]}` : "/trainings");
    router.refresh();
  }

  if (!training) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold">Szczegóły treningu</h1>

      <div className="rounded border bg-white p-4">
        <div className="text-sm">Data: {new Date(training.date).toLocaleDateString("pl-PL")}</div>
        <div className="text-sm">Zawodnicy: {(training.players || []).join(", ")}</div>
        <div className="text-sm">Elementów: {(training.entries || []).length}</div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="font-medium">Raport — zaznacz czy zawodnik się nauczył</div>
        <div className="mt-3 grid gap-3">
          {reports.map((r, i) => (
            <div key={i} className="rounded border p-3 flex items-center gap-3">
              <div className="text-sm">Zawodnik: {r.playerId}</div>
              <div className="text-sm">Skill: {r.skillId}</div>
              <label className="text-sm">
                <input type="checkbox" checked={r.learned} onChange={(e) => setReport(i, "learned", e.target.checked)} /> Nauczony
              </label>
              <input className="ml-auto rounded border px-2 py-1" placeholder="Notatka" value={r.notes} onChange={(e) => setReport(i, "notes", e.target.value)} />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button disabled={loading} onClick={submit} className="rounded bg-black px-3 py-2 text-white">
            {loading ? "Wysyłanie..." : "Wyślij raport"}
          </button>
        </div>
      </div>
    </div>
  );
}
