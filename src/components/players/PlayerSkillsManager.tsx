"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Skill = {
  _id: string;
  name: string;
  category?: string;
  details?: { _id: string; name: string; difficulty?: 1 | 2 | 3 }[];
};

type PlayerSkill = {
  _id: string;
  playerId: string;
  skillId: string;
  detailId?: string;
  plannedDate?: string;
  doneDate?: string;
  status: "plan" | "w_trakcie" | "zrobione";
  notes?: string;
};

function toDateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function PlayerSkillsManager({ playerId, canManage = true }: { playerId: string; canManage?: boolean }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [rows, setRows] = useState<PlayerSkill[]>([]);
  const [loading, setLoading] = useState(false);

  const [skillId, setSkillId] = useState("");
  const [selectedDetailIds, setSelectedDetailIds] = useState<string[]>([]);
  const [assignStatus, setAssignStatus] = useState<PlayerSkill["status"]>("plan");
  const [plannedDate, setPlannedDate] = useState("");
  const [notes, setNotes] = useState("");

  const selectedSkill = useMemo(() => skills.find((s) => s._id === skillId), [skills, skillId]);

  const loadAll = useCallback(async () => {
    const sRes = await fetch("/api/skills", { cache: "no-store" });
    const sData = await sRes.json().catch(() => []);
    setSkills(Array.isArray(sData) ? sData : []);

    const rRes = await fetch(`/api/player-skills?playerId=${playerId}`, { cache: "no-store" });
    const rData = await rRes.json().catch(() => []);
    setRows(Array.isArray(rData) ? rData : []);
  }, [playerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  async function addRow(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    if (!skillId) return;

    setLoading(true);

    const targetDetailIds = selectedDetailIds.length > 0 ? selectedDetailIds : [""];
    const today = new Date().toISOString().slice(0, 10);

    const responses = await Promise.all(
      targetDetailIds.map((did) =>
        fetch("/api/player-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            skillId,
            detailId: did || undefined,
            plannedDate: plannedDate || undefined,
            doneDate: assignStatus === "zrobione" ? today : undefined,
            notes: notes || undefined,
            status: assignStatus,
          }),
        })
      )
    );

    setLoading(false);

    if (responses.some((res) => !res.ok)) {
      alert("Nie udało się przypisać umiejętności");
      return;
    }

    setSelectedDetailIds([]);
    setAssignStatus("plan");
    setPlannedDate("");
    setNotes("");
    await loadAll();
  }

  async function updateRow(id: string, patch: Partial<PlayerSkill>) {
    if (!canManage) return;
    const res = await fetch(`/api/player-skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      alert("Nie udało się zapisać zmian");
      return;
    }

    await loadAll();
  }

  async function removeRow(id: string) {
    if (!canManage) return;
    const ok = window.confirm("Usunąć przypisaną umiejętność?");
    if (!ok) return;

    const res = await fetch(`/api/player-skills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Nie udało się usunąć");
      return;
    }

    await loadAll();
  }

  const skillName = (id: string) => skills.find((s) => s._id === id)?.name ?? "Umiejętność";
  const detailName = (sid: string, did?: string) => {
    if (!did) return "";
    const s = skills.find((x) => x._id === sid);
    return s?.details?.find((d) => d._id === did)?.name ?? "";
  };

  function toggleDetail(id: string) {
    setSelectedDetailIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllDetails() {
    const detailIds = (selectedSkill?.details ?? []).map((d) => d._id);
    const allSelected = detailIds.length > 0 && detailIds.every((id) => selectedDetailIds.includes(id));
    setSelectedDetailIds(allSelected ? [] : detailIds);
  }

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="text-lg font-semibold tracking-tight">Umiejetnosci i realizacja</div>
        <div className="mt-1 text-sm text-slate-600">Planowanie, status i daty realizacji.</div>
      </div>

      <div className="p-5">
        {canManage ? (
          <form onSubmit={addRow} className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="field-label">Umiejetnosc</label>
                <select
                  className="field-select"
                  value={skillId}
                  onChange={(e) => {
                    setSkillId(e.target.value);
                    setSelectedDetailIds([]);
                  }}
                >
                  <option value="">Wybierz umiejetnosc</option>
                  {skills.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="field-label">Status przy przypisaniu</label>
                <select className="field-select" value={assignStatus} onChange={(e) => setAssignStatus(e.target.value as PlayerSkill["status"])}>
                  <option value="plan">plan</option>
                  <option value="w_trakcie">w trakcie</option>
                  <option value="zrobione">zrobione (potrafi)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-1">
              <label className="field-label">Planowana data</label>
              <input className="field-input" type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
            </div>

            {/* Podumiejętności jako tagi */}
            {selectedSkill && (selectedSkill.details?.length ?? 0) > 0 && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="field-label">Podumiejetnosci (mozna zaznaczyc wiele)</label>
                  <button type="button" className="btn btn-secondary" onClick={toggleAllDetails}>
                    {(selectedSkill.details ?? []).every((d) => selectedDetailIds.includes(d._id)) ? "Wyczysc wszystkie" : "Zaznacz wszystkie"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedSkill.details ?? []).map((d) => (
                    <button
                      key={d._id}
                      type="button"
                      onClick={() => toggleDetail(d._id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                        selectedDetailIds.includes(d._id)
                          ? "bg-blue-500 text-white border-blue-600 shadow-md"
                          : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {selectedDetailIds.includes(d._id) ? "✓ " : ""}[P{d.difficulty ?? 1}] {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-1">
              <label className="field-label">Notatka</label>
              <input className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div>
              <button
                disabled={loading || !skillId}
                className="btn btn-primary"
                type="submit"
              >
                {loading ? "Dodawanie..." : assignStatus === "zrobione" ? "Oznacz jako potrafi" : "Przypisz umiejetnosc"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Podglad umiejetnosci przypisanych do zawodnika.
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        {rows.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">Brak przypisanych umiejetnosci</div>
        ) : (
          <div className="p-5 grid gap-3">
            {rows.map((r) => (
              <div key={r._id} className="surface-muted flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {skillName(r.skillId)} {detailName(r.skillId, r.detailId) ? `, ${detailName(r.skillId, r.detailId)}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Plan: {r.plannedDate ? formatDatePL(new Date(r.plannedDate)) : "brak"} , Wykonano: {r.doneDate ? formatDatePL(new Date(r.doneDate)) : "brak"}
                  </div>
                  {r.notes ? <div className="mt-1 text-xs text-slate-600">{r.notes}</div> : null}
                </div>

                {canManage ? (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="field-select"
                      value={r.status}
                      onChange={(e) => updateRow(r._id, { status: e.target.value as PlayerSkill["status"] })}
                    >
                      <option value="plan">plan</option>
                      <option value="w_trakcie">w trakcie</option>
                      <option value="zrobione">zrobione</option>
                    </select>

                    <input
                      className="field-input"
                      type="date"
                      value={toDateInput(r.doneDate)}
                      onChange={(e) => updateRow(r._id, { doneDate: e.target.value || undefined })}
                    />

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeRow(r._id)}
                    >
                      Usun
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-700">
                    Status: <span className="font-medium">{r.status.replace("_", " ")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDatePL(d: Date) {
  return d.toLocaleDateString("pl-PL");
}
