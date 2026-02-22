"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

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

type DifficultyKey = 1 | 2 | 3;

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

  const deferredSubQuery = useDeferredValue(subQuery);
  const deferredSkillQuery = useDeferredValue(skillQuery);
  const deferredSubPickerQuery = useDeferredValue(subPickerQuery);
  const deferredEditSubQuery = useDeferredValue(editSubQuery);

  const filteredSubskills = useMemo(
    () => subskills.filter((s) => s.name.toLowerCase().includes(deferredSubQuery.toLowerCase())),
    [subskills, deferredSubQuery],
  );

  const pickerSubskills = useMemo(
    () => subskills.filter((s) => s.name.toLowerCase().includes(deferredSubPickerQuery.toLowerCase())),
    [subskills, deferredSubPickerQuery],
  );

  const filteredSkills = useMemo(
    () => skills.filter((k) => k.name.toLowerCase().includes(deferredSkillQuery.toLowerCase())),
    [skills, deferredSkillQuery],
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

  function addVisiblePickerToSelection() {
    setSelectedSubIds((prev) => Array.from(new Set([...prev, ...pickerSubskills.map((sub) => sub._id)])));
  }

  function clearCreateSelection() {
    setSelectedSubIds([]);
  }

  function addVisibleEditPickerToSelection() {
    setEditSelectedSubIds((prev) => Array.from(new Set([...prev, ...filteredEditSubskills.map((sub) => sub._id)])));
  }

  function clearEditSelection() {
    setEditSelectedSubIds([]);
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

  function difficultyLabel(value?: number) {
    if (value === 2) return "Poziom 2 (sredni)";
    if (value === 3) return "Poziom 3 (zaawansowany)";
    return "Poziom 1 (podstawy)";
  }

  function difficultySectionTitle(level: DifficultyKey) {
    if (level === 2) return "Poziom 2";
    if (level === 3) return "Poziom 3";
    return "Poziom 1";
  }

  function groupByDifficulty(details: SubSkill[] = []) {
    return {
      p1: details.filter((d) => (d.difficulty ?? 1) === 1),
      p2: details.filter((d) => d.difficulty === 2),
      p3: details.filter((d) => d.difficulty === 3),
    };
  }

  const filteredEditSubskills = useMemo(() => {
    const query = deferredEditSubQuery.trim().toLowerCase();
    if (!query) return subskills;
    return subskills.filter((sub) => sub.name.toLowerCase().includes(query));
  }, [subskills, deferredEditSubQuery]);

  const subskillsById = useMemo(() => new Map(subskills.map((sub) => [sub._id, sub] as const)), [subskills]);

  const selectedSubskills = useMemo(
    () => selectedSubIds.map((id) => subskillsById.get(id)).filter(Boolean) as SubSkill[],
    [selectedSubIds, subskillsById],
  );

  const selectedEditSubskills = useMemo(
    () => editSelectedSubIds.map((id) => subskillsById.get(id)).filter(Boolean) as SubSkill[],
    [editSelectedSubIds, subskillsById],
  );

  function groupSubskillsByDifficulty(items: SubSkill[]) {
    return {
      1: items.filter((item) => (item.difficulty ?? 1) === 1),
      2: items.filter((item) => item.difficulty === 2),
      3: items.filter((item) => item.difficulty === 3),
    } as Record<DifficultyKey, SubSkill[]>;
  }

  const pickerGroups = useMemo(() => groupSubskillsByDifficulty(pickerSubskills), [pickerSubskills]);
  const editPickerGroups = useMemo(() => groupSubskillsByDifficulty(filteredEditSubskills), [filteredEditSubskills]);
  const subskillLibraryGroups = useMemo(() => groupSubskillsByDifficulty(filteredSubskills), [filteredSubskills]);

  function renderSelectedSubskillChips(items: SubSkill[], onRemove?: (id: string) => void) {
    if (items.length === 0) {
      return <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">Brak wybranych podumiejetnosci.</div>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((sub) => (
          <span key={sub._id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
            <span>{sub.name}</span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${difficultyBadgeClass(sub.difficulty)}`}>
              P{sub.difficulty ?? 1}
            </span>
            {onRemove ? (
              <button type="button" onClick={() => onRemove(sub._id)} className="text-slate-500 hover:text-slate-800" aria-label={`Usun ${sub.name}`}>
                x
              </button>
            ) : null}
          </span>
        ))}
      </div>
    );
  }

  function renderPickerGroup(
    level: DifficultyKey,
    items: SubSkill[],
    selectedIds: string[],
    onToggle: (id: string) => void,
  ) {
    if (items.length === 0) return null;

    return (
      <div key={`level-${level}`} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{difficultySectionTitle(level)}</div>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficultyBadgeClass(level)}`}>{items.length}</span>
        </div>
        <div className="grid gap-2">
          {items.map((sub) => {
            const checked = selectedIds.includes(sub._id);
            return (
              <label
                key={sub._id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                  checked ? "border-sky-200 bg-sky-50/70" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input className="mt-0.5" type="checkbox" checked={checked} onChange={() => onToggle(sub._id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">{sub.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficultyBadgeClass(sub.difficulty)}`}>
                      P{sub.difficulty ?? 1}
                    </span>
                  </div>
                  {sub.description ? <div className="mt-0.5 text-xs text-slate-500">{sub.description}</div> : null}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Zarzadzanie umiejetnosciami</h1>
        <p className="page-subtitle">Tworzenie podumiejetnosci, budowa biblioteki i szybka edycja zestawow.</p>
      </div>

      <div className="surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Umiejetnosci</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{skills.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Podumiejetnosci</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{subskills.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wybrane do nowej</div>
            <div className="mt-1 text-2xl font-semibold text-sky-700">{selectedSubIds.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Widoczne na liscie</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{displayedSkills.length}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="surface-muted p-4">
            <div className="section-title">Biblioteka podumiejetnosci</div>
            <p className="section-copy">Najpierw dodaj atomy techniczne. Potem wykorzystasz je w umiejetnosciach glownych.</p>

            <form onSubmit={createSub} className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
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
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className="field-select"
                  value={subDifficulty}
                  onChange={(event) => setSubDifficulty(Number(event.target.value) as 1 | 2 | 3)}
                  aria-label="Poziom trudnosci"
                >
                  <option value={1}>Poziom 1</option>
                  <option value={2}>Poziom 2</option>
                  <option value={3}>Poziom 3</option>
                </select>
                <button className="btn btn-primary" disabled={creatingSub}>
                  {creatingSub ? "Tworzenie..." : "Dodaj"}
                </button>
              </div>
            </form>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-700">Istniejace podumiejetnosci</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${difficultyBadgeClass(1)}`}>
                    P1: {subskillLibraryGroups[1].length}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${difficultyBadgeClass(2)}`}>
                    P2: {subskillLibraryGroups[2].length}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${difficultyBadgeClass(3)}`}>
                    P3: {subskillLibraryGroups[3].length}
                  </span>
                </div>
              </div>

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
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-800">{sub.name}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficultyBadgeClass(sub.difficulty)}`}>
                            P{sub.difficulty ?? 1}
                          </span>
                          <span className="text-[11px] text-slate-500">{difficultyLabel(sub.difficulty)}</span>
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
            <div className="section-title">Nowa umiejetnosc glowna</div>
            <p className="section-copy">Nadaj nazwe, wybierz podumiejetnosci i od razu zobacz podglad zestawu.</p>

            <form onSubmit={createSkill} className="mt-4 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <label className="field-label">Nazwa umiejetnosci</label>
                <input
                  className="field-input mt-1"
                  value={skillName}
                  onChange={(event) => setSkillName(event.target.value)}
                  placeholder="Np. Prowadzenie pilki pod presja"
                  required
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Wybierz podumiejetnosci</div>
                    <div className="text-xs text-slate-500">Filtruj liste i zaznaczaj pojedynczo albo hurtowo.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary" onClick={addVisiblePickerToSelection} disabled={pickerSubskills.length === 0}>
                      Dodaj widoczne
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={clearCreateSelection} disabled={selectedSubIds.length === 0}>
                      Wyczyść wybor
                    </button>
                  </div>
                </div>

                <input
                  className="field-input mt-3"
                  placeholder="Filtr listy podumiejetnosci..."
                  value={subPickerQuery}
                  onChange={(event) => setSubPickerQuery(event.target.value)}
                />

                <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {pickerSubskills.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-slate-500">Brak podumiejetnosci dla podanego filtra.</div>
                  ) : (
                    <div className="grid gap-3">
                      {[1, 2, 3].map((level) =>
                        renderPickerGroup(level as DifficultyKey, pickerGroups[level as DifficultyKey], selectedSubIds, toggleSelect),
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-700">Podglad wyboru</div>
                    <span className="pill">Wybrano: {selectedSubIds.length}</span>
                  </div>
                  {renderSelectedSubskillChips(selectedSubskills, (id) =>
                    setSelectedSubIds((prev) => prev.filter((value) => value !== id)),
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm text-slate-600">
                  {skillName.trim() ? (
                    <>
                      Tworzysz: <span className="font-semibold text-slate-900">{skillName}</span>
                    </>
                  ) : (
                    "Wpisz nazwe, aby utworzyc nowa umiejetnosc."
                  )}
                </div>
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

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="pill">Wyniki: {filteredSkills.length}</span>
          <span className="pill">Pokazane: {displayedSkills.length}</span>
          {editingId ? <span className="pill">Tryb edycji aktywny</span> : null}
        </div>

        {loading ? <div className="text-sm text-slate-600">Ladowanie...</div> : null}

        {!loading && displayedSkills.length === 0 ? <div className="text-sm text-slate-600">Brak umiejetnosci.</div> : null}

        {!loading && displayedSkills.length > 0 ? (
          <div className="entity-grid">
            {displayedSkills.map((skill) => (
              <article
                key={skill._id}
                className={`entity-card ${editingId === skill._id ? "border-sky-300 shadow-[0_14px_28px_rgba(2,132,199,0.15)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="entity-title">{skill.name}</h3>
                    {editingId === skill._id ? <div className="entity-subtle text-sky-700">Edytujesz te umiejetnosc</div> : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {editingId === skill._id ? <span className="pill">Edycja</span> : null}
                    <span className="pill">{skill.details?.length ?? 0} podum.</span>
                  </div>
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
                  <form onSubmit={saveEdit} className="mt-4 space-y-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3">
                    <div>
                      <label className="field-label">Nazwa umiejetnosci</label>
                      <input className="field-input mt-1" value={editName} onChange={(event) => setEditName(event.target.value)} required />
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">Podumiejetnosci w edycji</div>
                          <div className="text-xs text-slate-500">Mozesz filtrowac i hurtowo dodac widoczne elementy.</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={addVisibleEditPickerToSelection}
                            disabled={filteredEditSubskills.length === 0}
                          >
                            Dodaj widoczne
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={clearEditSelection} disabled={editSelectedSubIds.length === 0}>
                            Wyczyść wybor
                          </button>
                        </div>
                      </div>

                      <input
                        className="field-input"
                        value={editSubQuery}
                        onChange={(event) => setEditSubQuery(event.target.value)}
                        placeholder="Filtruj podumiejetnosci w edycji..."
                      />

                      <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                        {filteredEditSubskills.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-slate-500">Brak wynikow dla filtra.</div>
                        ) : (
                          <div className="grid gap-3">
                            {[1, 2, 3].map((level) =>
                              renderPickerGroup(level as DifficultyKey, editPickerGroups[level as DifficultyKey], editSelectedSubIds, toggleEditSelect),
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-slate-700">Wybrane w edycji</div>
                          <span className="pill">{editSelectedSubIds.length}</span>
                        </div>
                        {renderSelectedSubskillChips(selectedEditSubskills, (id) =>
                          setEditSelectedSubIds((prev) => prev.filter((value) => value !== id)),
                        )}
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
