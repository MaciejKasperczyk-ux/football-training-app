"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SubSkill = {
  _id: string;
  name: string;
  description?: string;
  difficulty?: 1 | 2 | 3;
};

type Skill = {
  _id: string;
  name: string;
  details: SubSkill[];
};

export default function AdminSkillsPage() {
  const [subskills, setSubskills] = useState<SubSkill[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subQuery, setSubQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [subPickerQuery, setSubPickerQuery] = useState("");

  const [skillPage, setSkillPage] = useState(1);
  const itemsPerPage = 9;

  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subDifficulty, setSubDifficulty] = useState<1 | 2 | 3>(1);
  const [creatingSub, setCreatingSub] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);

  const [skillName, setSkillName] = useState("");
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [creatingSkill, setCreatingSkill] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSelectedSubIds, setEditSelectedSubIds] = useState<string[]>([]);
  const [editSubQuery, setEditSubQuery] = useState("");

  const filteredSubskills = useMemo(
    () => subskills.filter((s) => s.name.toLowerCase().includes(subQuery.toLowerCase())),
    [subskills, subQuery],
  );

  const pickerSubskills = useMemo(
    () => subskills.filter((s) => s.name.toLowerCase().includes(subPickerQuery.toLowerCase())),
    [subskills, subPickerQuery],
  );

  const filteredSkills = useMemo(
    () => skills.filter((k) => k.name.toLowerCase().includes(skillQuery.toLowerCase())),
    [skills, skillQuery],
  );

  const displayedSkills = filteredSkills.slice(0, skillPage * itemsPerPage);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, skillRes] = await Promise.all([fetch("/api/subskills"), fetch("/api/skills")]);
      const subData = await subRes.json().catch(() => []);
      const skillData = await skillRes.json().catch(() => []);

      if (!subRes.ok || !skillRes.ok) {
        setError("Nie udalo sie pobrac danych.");
        return;
      }

      setSubskills(Array.isArray(subData) ? subData : []);
      setSkills(Array.isArray(skillData) ? skillData : []);
    } catch {
      setError("Blad pobierania danych.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function createSub(event: React.FormEvent) {
    event.preventDefault();
    setCreatingSub(true);
    setError(null);

    try {
      const res = await fetch("/api/subskills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subName, description: subDesc, difficulty: subDifficulty }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ? JSON.stringify(data.error) : "Blad tworzenia podumiejetnosci.");
        return;
      }

      setSubName("");
      setSubDesc("");
      setSubDifficulty(1);
      await fetchAll();
    } catch {
      setError("Blad tworzenia podumiejetnosci.");
    } finally {
      setCreatingSub(false);
    }
  }

  async function createSkill(event: React.FormEvent) {
    event.preventDefault();
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
        setError(data?.error ? JSON.stringify(data.error) : "Blad tworzenia umiejetnosci.");
        return;
      }

      setSkillName("");
      setSelectedSubIds([]);
      setSubPickerQuery("");
      await fetchAll();
    } catch {
      setError("Blad tworzenia umiejetnosci.");
    } finally {
      setCreatingSkill(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function deleteSub(id: string) {
    if (!confirm("Usun podumiejetnosc?")) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/subskills/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ? JSON.stringify(data.error) : "Blad usuwania podumiejetnosci.");
      }
      await fetchAll();
    } catch {
      setError("Blad usuwania podumiejetnosci.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSkill(id: string) {
    if (!confirm("Usun umiejetnosc?")) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ? JSON.stringify(data.error) : "Blad usuwania umiejetnosci.");
      }
      await fetchAll();
    } catch {
      setError("Blad usuwania umiejetnosci.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(skill: Skill) {
    setEditingId(skill._id);
    setEditName(skill.name);
    setEditSelectedSubIds((skill.details || []).map((detail) => detail._id));
    setEditSubQuery("");
  }

  function toggleEditSelect(id: string) {
    setEditSelectedSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);

    try {
      const res = await fetch(`/api/skills/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, details: editSelectedSubIds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ? JSON.stringify(data.error) : "Blad aktualizacji umiejetnosci.");
        return;
      }

      setEditingId(null);
      setEditName("");
      setEditSelectedSubIds([]);
      await fetchAll();
    } catch {
      setError("Blad aktualizacji umiejetnosci.");
    }
  }

  function difficultyBadgeClass(value?: number) {
    if (value === 2) return "bg-sky-100 text-sky-800 border-sky-200";
    if (value === 3) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  function groupByDifficulty(details: SubSkill[] = []) {
    return {
      p1: details.filter((d) => (d.difficulty ?? 1) === 1),
      p2: details.filter((d) => d.difficulty === 2),
      p3: details.filter((d) => d.difficulty === 3),
    };
  }

  const filteredEditSubskills = useMemo(() => {
    const query = editSubQuery.trim().toLowerCase();
    if (!query) return subskills;
    return subskills.filter((sub) => sub.name.toLowerCase().includes(query));
  }, [subskills, editSubQuery]);

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Zarzadzanie umiejetnosciami</h1>
        <p className="page-subtitle">Tworzenie podumiejetnosci, budowa biblioteki i szybka edycja zestawow.</p>
      </div>

      <div className="surface p-4">
        <div className="entity-stats">
          <span className="pill">Umiejetnosci: {skills.length}</span>
          <span className="pill">Podumiejetnosci: {subskills.length}</span>
          <span className="pill">Widocznych: {displayedSkills.length}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface-muted p-4">
            <div className="section-title">Dodaj podumiejetnosc</div>
            <p className="section-copy">Zdefiniuj male elementy techniczne, ktore potem przypniesz do umiejetnosci glownej.</p>

            <form onSubmit={createSub} className="mt-4 grid gap-2">
              <input
                className="field-input"
                value={subName}
                onChange={(event) => setSubName(event.target.value)}
                placeholder="Nazwa podumiejetnosci"
                required
              />
              <input
                className="field-input"
                value={subDesc}
                onChange={(event) => setSubDesc(event.target.value)}
                placeholder="Opis (opcjonalnie)"
              />
              <select
                className="field-select"
                value={subDifficulty}
                onChange={(event) => setSubDifficulty(Number(event.target.value) as 1 | 2 | 3)}
              >
                <option value={1}>Poziom 1</option>
                <option value={2}>Poziom 2</option>
                <option value={3}>Poziom 3</option>
              </select>
              <div className="flex justify-end">
                <button className="btn btn-primary" disabled={creatingSub}>
                  {creatingSub ? "Tworzenie..." : "Utworz podumiejetnosc"}
                </button>
              </div>
            </form>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">Istniejace podumiejetnosci</div>
              <input
                placeholder="Szukaj podumiejetnosci..."
                value={subQuery}
                onChange={(event) => setSubQuery(event.target.value)}
                className="field-input"
              />

              {filteredSubskills.length === 0 ? (
                <div className="mt-3 text-sm text-slate-600">Brak wynikow.</div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {(showAllSubs ? filteredSubskills : filteredSubskills.slice(0, 8)).map((sub) => (
                    <div key={sub._id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-800">{sub.name}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficultyBadgeClass(sub.difficulty)}`}>
                            P{sub.difficulty ?? 1}
                          </span>
                        </div>
                        {sub.description ? <div className="text-xs text-slate-500">{sub.description}</div> : null}
                      </div>
                      <button onClick={() => deleteSub(sub._id)} className="btn btn-danger">
                        Usun
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {filteredSubskills.length > 8 ? (
                <button onClick={() => setShowAllSubs((value) => !value)} className="mt-3 text-sm font-medium text-slate-700 underline">
                  {showAllSubs ? "Pokaz mniej" : `Pokaz wszystkie (${filteredSubskills.length})`}
                </button>
              ) : null}
            </div>
          </section>

          <section className="surface-muted p-4">
            <div className="section-title">Dodaj glowna umiejetnosc</div>
            <p className="section-copy">Zbuduj nowa umiejetnosc i przypisz do niej gotowe podumiejetnosci.</p>

            <form onSubmit={createSkill} className="mt-4 grid gap-3">
              <input
                className="field-input"
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                placeholder="Nazwa umiejetnosci"
                required
              />

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Wybierz podumiejetnosci</div>
                <input
                  className="field-input"
                  placeholder="Filtr listy..."
                  value={subPickerQuery}
                  onChange={(event) => setSubPickerQuery(event.target.value)}
                />
                <div className="mt-2 max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                  {pickerSubskills.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-slate-500">Brak podumiejetnosci.</div>
                  ) : (
                    <div className="grid gap-1.5">
                      {pickerSubskills.map((sub) => (
                        <label key={sub._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                          <input type="checkbox" checked={selectedSubIds.includes(sub._id)} onChange={() => toggleSelect(sub._id)} />
                          <span>{sub.name}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficultyBadgeClass(sub.difficulty)}`}>
                            P{sub.difficulty ?? 1}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500">Wybrano: {selectedSubIds.length}</div>
              </div>

              <div className="flex justify-end">
                <button className="btn btn-primary" disabled={creatingSkill}>
                  {creatingSkill ? "Tworzenie..." : "Utworz umiejetnosc"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <div className="surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Lista umiejetnosci</h2>
            <p className="section-copy">Edycja nazw i przypietych podumiejetnosci bez przechodzenia do innego widoku.</p>
          </div>
          <div className="w-full md:w-80">
            <input
              placeholder="Szukaj umiejetnosci..."
              value={skillQuery}
              onChange={(event) => {
                setSkillQuery(event.target.value);
                setSkillPage(1);
              }}
              className="field-input"
            />
          </div>
        </div>

        {loading ? <div className="text-sm text-slate-600">Ladowanie...</div> : null}

        {!loading && displayedSkills.length === 0 ? <div className="text-sm text-slate-600">Brak umiejetnosci.</div> : null}

        {!loading && displayedSkills.length > 0 ? (
          <div className="entity-grid">
            {displayedSkills.map((skill) => (
              <article key={skill._id} className="entity-card">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="entity-title">{skill.name}</h3>
                  <span className="pill">{skill.details?.length ?? 0} podum.</span>
                </div>

                {(() => {
                  const groups = groupByDifficulty(skill.details || []);
                  return (
                    <div className="mt-3 grid gap-2 text-xs">
                      <div>
                        <span className="mr-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                          P1: {groups.p1.length}
                        </span>
                        <span className="text-slate-600">
                          {groups.p1.slice(0, 3).map((d) => d.name).join(", ")}
                          {groups.p1.length > 3 ? "..." : ""}
                        </span>
                      </div>
                      <div>
                        <span className="mr-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-semibold text-sky-800">
                          P2: {groups.p2.length}
                        </span>
                        <span className="text-slate-600">
                          {groups.p2.slice(0, 3).map((d) => d.name).join(", ")}
                          {groups.p2.length > 3 ? "..." : ""}
                        </span>
                      </div>
                      <div>
                        <span className="mr-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-semibold text-orange-800">
                          P3: {groups.p3.length}
                        </span>
                        <span className="text-slate-600">
                          {groups.p3.slice(0, 3).map((d) => d.name).join(", ")}
                          {groups.p3.length > 3 ? "..." : ""}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button onClick={() => startEdit(skill)} className="btn btn-secondary">
                    Edytuj
                  </button>
                  <button onClick={() => deleteSkill(skill._id)} className="btn btn-danger">
                    Usun
                  </button>
                </div>

                {editingId === skill._id ? (
                  <form onSubmit={saveEdit} className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                    <input className="field-input" value={editName} onChange={(event) => setEditName(event.target.value)} required />
                    <input
                      className="field-input"
                      value={editSubQuery}
                      onChange={(event) => setEditSubQuery(event.target.value)}
                      placeholder="Filtruj podumiejetnosci w edycji..."
                    />
                    <div className="max-h-44 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                      <div className="grid gap-1.5">
                        {filteredEditSubskills.map((sub) => (
                          <label key={sub._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                            <input type="checkbox" checked={editSelectedSubIds.includes(sub._id)} onChange={() => toggleEditSelect(sub._id)} />
                            <span>{sub.name}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficultyBadgeClass(sub.difficulty)}`}>
                              P{sub.difficulty ?? 1}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-primary" type="submit">
                        Zapisz
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary">
                        Anuluj
                      </button>
                    </div>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {displayedSkills.length < filteredSkills.length ? (
          <div className="mt-4 flex justify-center">
            <button onClick={() => setSkillPage((value) => value + 1)} className="btn btn-secondary">
              Pokaz wiecej
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
