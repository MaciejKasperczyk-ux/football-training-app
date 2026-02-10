"use client";

import { useEffect, useState } from "react";

interface SubSkill {
  _id: string;
  name: string;
  description?: string;
}

interface Skill {
  _id: string;
  name: string;
  details: SubSkill[];
}

export default function AdminSkillsPage() {
  const [subskills, setSubskills] = useState<SubSkill[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subQuery, setSubQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");

  const filteredSubskills = subskills.filter((s) => s.name.toLowerCase().includes(subQuery.toLowerCase()));
  const [skillPage, setSkillPage] = useState(1);
  const itemsPerPage = 10;
  const filteredSkills = skills.filter((k) => k.name.toLowerCase().includes(skillQuery.toLowerCase()));
  const displayedSkills = filteredSkills.slice(0, skillPage * itemsPerPage);

  // create subskill
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [creatingSub, setCreatingSub] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);

  // create skill
  const [skillName, setSkillName] = useState("");
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [creatingSkill, setCreatingSkill] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [sRes, kRes] = await Promise.all([fetch("/api/subskills"), fetch("/api/skills")]);
      const subs = await sRes.json();
      const ks = await kRes.json();
      setSubskills(subs || []);
      setSkills(ks || []);
    } catch (e) {
      setError("Błąd pobierania danych");
    }
    setLoading(false);
  }

  async function createSub(e: React.FormEvent) {
    e.preventDefault();
    setCreatingSub(true);
    setError(null);
    const res = await fetch("/api/subskills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: subName, description: subDesc }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Błąd tworzenia podumiejętności");
      setCreatingSub(false);
      return;
    }
    setSubName("");
    setSubDesc("");
    await fetchAll();
    setCreatingSub(false);
  }

  async function createSkill(e: React.FormEvent) {
    e.preventDefault();
    setCreatingSkill(true);
    setError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: skillName, details: selectedSubIds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ? JSON.stringify(data.error) : "Błąd tworzenia umiejętności");
        setCreatingSkill(false);
        return;
      }
      setSkillName("");
      setSelectedSubIds([]);
      await fetchAll();
    } catch (e) {
      setError("Błąd tworzenia umiejętności");
    }
    setCreatingSkill(false);
  }

  function toggleSelect(id: string) {
    setSelectedSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function deleteSub(id: string) {
    if (!confirm("Usuń podumiejętność?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/subskills/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ? JSON.stringify(d.error) : "Błąd usuwania");
      }
      await fetchAll();
    } catch (e) {
      setError("Błąd usuwania");
    }
    setLoading(false);
  }

  async function deleteSkill(id: string) {
    if (!confirm("Usuń umiejętność?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ? JSON.stringify(d.error) : "Błąd usuwania");
      }
      await fetchAll();
    } catch (e) {
      setError("Błąd usuwania");
    }
    setLoading(false);
  }

  // editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSelectedSubIds, setEditSelectedSubIds] = useState<string[]>([]);

  function startEdit(k: Skill) {
    setEditingId(k._id);
    setEditName(k.name);
    setEditSelectedSubIds((k.details || []).map((d) => d._id));
  }

  function toggleEditSelect(id: string) {
    setEditSelectedSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const res = await fetch(`/api/skills/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, details: editSelectedSubIds }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Błąd aktualizacji");
      return;
    }
    setEditingId(null);
    setEditName("");
    setEditSelectedSubIds([]);
    await fetchAll();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Zarządzanie umiejętnościami</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-medium">Dodaj podumiejętność</h2>
          <form onSubmit={createSub} className="space-y-2 mt-3">
            <input className="w-full rounded border px-3 py-2" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Nazwa" required />
            <input className="w-full rounded border px-3 py-2" value={subDesc} onChange={(e) => setSubDesc(e.target.value)} placeholder="Opis (opcjonalnie)" />
            <button className="rounded bg-black px-3 py-2 text-white" disabled={creatingSub}>{creatingSub ? "Tworzenie..." : "Utwórz podumiejętność"}</button>
          </form>

          <div className="mt-4">
            <h3 className="text-sm font-medium">Istniejące podumiejętności</h3>
            <div className="mt-2">
              <input
                placeholder="Szukaj podumiejętności..."
                value={subQuery}
                onChange={(e) => setSubQuery(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            {subskills.length === 0 ? (
              <p className="text-sm mt-2">Brak</p>
            ) : (
              <div className="mt-2 text-sm">
                <ul className="space-y-2" style={{ maxHeight: 280, overflow: 'auto' }}>
                  {(showAllSubs ? filteredSubskills : filteredSubskills.slice(0, 10)).map((s) => (
                    <li key={s._id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-slate-600">{s.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => deleteSub(s._id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Usuń</button>
                      </div>
                    </li>
                  ))}
                </ul>
                {filteredSubskills.length > 10 ? (
                  <div className="mt-2">
                    <button onClick={() => setShowAllSubs(!showAllSubs)} className="text-sm text-slate-700 underline">{showAllSubs ? 'Pokaż mniej' : `Pokaż wszystkie (${filteredSubskills.length})`}</button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-medium">Dodaj główną umiejętność</h2>
          <form onSubmit={createSkill} className="space-y-2 mt-3">
            <input className="w-full rounded border px-3 py-2" value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Nazwa umiejętności" required />

            <div className="mt-2">
              <div className="text-sm font-medium">Wybierz podumiejętności</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                {subskills.map((s) => (
                  <label key={s._id} className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedSubIds.includes(s._id)} onChange={() => toggleSelect(s._id)} />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="rounded bg-black px-3 py-2 text-white" disabled={creatingSkill}>{creatingSkill ? "Tworzenie..." : "Utwórz umiejętność"}</button>
          </form>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Lista umiejętności</h2>
          <div className="w-1/3">
            <input
              placeholder="Szukaj umiejętności..."
              value={skillQuery}
              onChange={(e) => { setSkillQuery(e.target.value); setSkillPage(1); }}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
        </div>
        {loading ? (<p className="text-sm">Ładowanie...</p>) : (
          <div className="mt-3 text-sm">
            {skills.length === 0 ? <p>Brak</p> : (
              <ul className="space-y-3">
                {displayedSkills.map((k) => (
                  <li key={k._id} className="border-b pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{k.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{(k.details || []).map((d) => d.name).join(", ")}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{(k.details || []).length} podum.</div>
                        <button onClick={() => startEdit(k)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edytuj</button>
                        <button onClick={() => deleteSkill(k._id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Usuń</button>
                      </div>
                    </div>

                    {editingId === k._id ? (
                      <form onSubmit={saveEdit} className="mt-3 space-y-2">
                        <input className="w-full rounded border px-3 py-2" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          {subskills.map((s) => (
                            <label key={s._id} className="flex items-center gap-2">
                              <input type="checkbox" checked={editSelectedSubIds.includes(s._id)} onChange={() => toggleEditSelect(s._id)} />
                              <span>{s.name}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button className="rounded bg-black px-3 py-2 text-white" type="submit">Zapisz</button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded border px-3 py-2">Anuluj</button>
                        </div>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {displayedSkills.length < filteredSkills.length ? (
              <div className="mt-3 text-center">
                <button onClick={() => setSkillPage((p) => p + 1)} className="rounded border px-3 py-2">Pokaż więcej</button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>
  );
}
