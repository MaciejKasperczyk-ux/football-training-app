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

export default function PlayerGoals({ playerId }: { playerId: string }) {
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
    load();
  }, [playerId]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
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
      alert("Nie udało się dodać celu");
      return;
    }

    setTitle("");
    setDescription("");
    await load();
  }

  async function setStatus(goalId: string, status: Goal["status"]) {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      alert("Nie udało się zmienić statusu");
      return;
    }

    await load();
  }

  async function removeGoal(goalId: string) {
    const ok = window.confirm("Czy na pewno usunąć cel?");
    if (!ok) return;

    const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Nie udało się usunąć celu");
      return;
    }

    await load();
  }

  return (
    <div className="rounded border bg-white overflow-hidden">
      <div className="border-b p-3 font-medium bg-gray-50">Cele i terminy</div>

      <div className="p-3">
        <form onSubmit={addGoal} className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Nazwa celu</label>
            <input className="rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Opis</label>
            <input className="rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm">Termin</label>
              <input className="rounded border px-3 py-2" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="flex items-end">
              <button
                disabled={loading || !title.trim()}
                className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
                type="submit"
              >
                {loading ? "Dodawanie" : "Dodaj cel"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="border-t">
        {goals.length === 0 ? (
          <div className="p-3 text-sm">Brak celów</div>
        ) : (
          goals.map((g) => {
            const due = new Date(g.dueDate);
            return (
              <div key={g._id} className="border-b p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{g.title}</div>
                    <div className="text-xs text-gray-700 mt-1">
                      Termin: {due.toLocaleDateString("pl-PL")} , status: {g.status}
                    </div>
                    {g.description ? <div className="text-xs text-gray-700 mt-1">{g.description}</div> : null}
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="rounded border px-2 py-1 text-sm"
                      value={g.status}
                      onChange={(e) => setStatus(g._id, e.target.value as any)}
                    >
                      <option value="planned">plan</option>
                      <option value="in_progress">w trakcie</option>
                      <option value="done">zrobione</option>
                    </select>

                    <button
                      type="button"
                      className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => removeGoal(g._id)}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}