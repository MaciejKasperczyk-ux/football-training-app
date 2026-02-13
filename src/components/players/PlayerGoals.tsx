"use client";

import { useEffect, useState } from "react";

type Goal = {
  _id: string;
  playerId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "planned" | "in_progress" | "done";
};

export default function PlayerGoals({ playerId, canManage = true }: { playerId: string; canManage?: boolean }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    const res = await fetch(`/api/goals?playerId=${playerId}`, { cache: "no-store" });
    const data = await res.json();
    setGoals(data);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setLoading(true);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        title,
        description: description || undefined,
        dueDate,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      alert("Nie udalo sie dodac celu.");
      return;
    }

    setTitle("");
    setDescription("");
    await load();
  }

  async function setStatus(goalId: string, status: Goal["status"]) {
    if (!canManage) return;
    const res = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      alert("Nie udalo sie zmienic statusu.");
      return;
    }

    await load();
  }

  async function removeGoal(goalId: string) {
    if (!canManage) return;
    if (!window.confirm("Czy na pewno usunac cel?")) return;

    const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Nie udalo sie usunac celu.");
      return;
    }

    await load();
  }

  return (
    <div className="surface p-5">
      <div className="mb-3">
        <h2 className="section-title">Cele i terminy</h2>
        <p className="section-copy">Monitorowanie postepu i deadlinow zawodnika.</p>
      </div>

      {canManage ? (
        <form onSubmit={addGoal} className="grid gap-3">
          <div className="grid gap-1">
            <label className="field-label">Nazwa celu</label>
            <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="field-label">Opis</label>
            <input className="field-input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <label className="field-label">Termin</label>
              <input className="field-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="flex items-end">
              <button disabled={loading || !title.trim()} className="btn btn-primary" type="submit">
                {loading ? "Dodawanie..." : "Dodaj cel"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Podglad celow zawodnika.
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {goals.length === 0 ? (
          <div className="text-sm text-slate-600">Brak celow.</div>
        ) : (
          goals.map((goal) => (
            <div key={goal._id} className="surface-muted p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{goal.title}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Termin: {new Date(goal.dueDate).toLocaleDateString("pl-PL")}
                  </div>
                  {goal.description ? <div className="mt-1 text-xs text-slate-600">{goal.description}</div> : null}
                </div>

                {canManage ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="field-select"
                      value={goal.status}
                      onChange={(e) => setStatus(goal._id, e.target.value as Goal["status"])}
                    >
                      <option value="planned">plan</option>
                      <option value="in_progress">w trakcie</option>
                      <option value="done">zrobione</option>
                    </select>

                    <button type="button" className="btn btn-danger" onClick={() => removeGoal(goal._id)}>
                      Usun
                    </button>
                  </div>
                ) : (
                  <span className="pill">{goal.status.replace("_", " ")}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
