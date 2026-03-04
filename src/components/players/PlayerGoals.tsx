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

  const plannedCount = goals.filter((goal) => goal.status === "planned").length;
  const inProgressCount = goals.filter((goal) => goal.status === "in_progress").length;
  const doneCount = goals.filter((goal) => goal.status === "done").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Cele i terminy</h2>
            <p className="mt-1 text-sm text-slate-600">Planuj i monitoruj postepy zawodnika tydzien po tygodniu.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">Plan: {plannedCount}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">W trakcie: {inProgressCount}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">Zrobione: {doneCount}</span>
          </div>
        </div>
      </div>

      {canManage ? (
        <form onSubmit={addGoal} className="grid gap-4 border-b border-slate-200 bg-slate-50/70 p-5">
          <div className="grid gap-1.5">
            <label className="field-label">Nazwa celu</label>
            <input
              className="field-input bg-white"
              placeholder="Np. 80% celnych podan pod presja"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="field-label">Opis</label>
            <input
              className="field-input bg-white"
              placeholder="Dodatkowe kryteria lub kontekst"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-1.5">
              <label className="field-label">Termin</label>
              <input className="field-input bg-white" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="flex items-end">
              <button disabled={loading || !title.trim()} className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" type="submit">
                {loading ? "Dodawanie..." : "Dodaj cel"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Podglad celow zawodnika.
        </div>
      )}

      <div className="grid gap-3 p-5">
        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            Brak celow.
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{goal.title}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Termin: {new Date(goal.dueDate).toLocaleDateString("pl-PL")}
                  </div>
                  {goal.description ? <div className="mt-1.5 text-xs text-slate-600">{goal.description}</div> : null}
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${goalStatusClass(goal.status)}`}>
                      {goalStatusLabel(goal.status)}
                    </span>
                  </div>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="field-select min-w-[145px] bg-white"
                      value={goal.status}
                      onChange={(e) => setStatus(goal._id, e.target.value as Goal["status"])}
                    >
                      <option value="planned">plan</option>
                      <option value="in_progress">w trakcie</option>
                      <option value="done">zrobione</option>
                    </select>

                    <button type="button" className="inline-flex h-10 items-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100" onClick={() => removeGoal(goal._id)}>
                      Usun
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function goalStatusLabel(status: Goal["status"]) {
  if (status === "done") return "zrobione";
  if (status === "in_progress") return "w trakcie";
  return "plan";
}

function goalStatusClass(status: Goal["status"]) {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}
