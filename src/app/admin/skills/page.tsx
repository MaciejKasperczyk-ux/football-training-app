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

  // create subskill
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [creatingSub, setCreatingSub] = useState(false);

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
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: skillName, details: selectedSubIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Błąd tworzenia umiejętności");
      setCreatingSkill(false);
      return;
    }
    setSkillName("");
    setSelectedSubIds([]);
    await fetchAll();
    setCreatingSkill(false);
  }

  function toggleSelect(id: string) {
    setSelectedSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function deleteSub(id: string) {
    if (!confirm("Usunąć podumiejętność?")) return;
    const res = await fetch(`/api/subskills/${id}`, { method: "DELETE" });
    if (!res.ok) return setError("Błąd usuwania");
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
            {subskills.length === 0 ? (
              <p className="text-sm mt-2">Brak</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {subskills.map((s) => (
                  <li key={s._id} className="flex items-center justify-between">
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
        <h2 className="text-lg font-medium">Lista umiejętności</h2>
        {loading ? (<p className="text-sm">Ładowanie...</p>) : (
          <div className="mt-3 text-sm">
            {skills.length === 0 ? <p>Brak</p> : (
              <ul className="space-y-3">
                {skills.map((k) => (
                  <li key={k._id} className="border-b pb-2">
                    <div className="font-medium">{k.name}</div>
                    <div className="text-xs text-slate-600 mt-1">{(k.details || []).map(d => d.name).join(", ")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>
  );
}
