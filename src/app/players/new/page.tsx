"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Skill = {
  _id: string;
  name: string;
  details?: Array<{ _id: string; name: string }>;
};

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [club, setClub] = useState("");
  const [position, setPosition] = useState("");
  const [age] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [dominantFoot, setDominantFoot] = useState<string>("");
  const [discAssignedTo, setDiscAssignedTo] = useState<"player" | "admin">("player");
  const [showSkillsPicker, setShowSkillsPicker] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedDetailsBySkill, setSelectedDetailsBySkill] = useState<Record<string, string[]>>({});

  async function toggleSkillsPicker() {
    const nextOpen = !showSkillsPicker;
    setShowSkillsPicker(nextOpen);
    if (!nextOpen || skills.length > 0) return;
    setSkillsLoading(true);
    try {
      const res = await fetch("/api/skills", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setSkills(Array.isArray(data) ? (data as Skill[]) : []);
    } finally {
      setSkillsLoading(false);
    }
  }

  function toggleSkill(skillId: string) {
    setSelectedSkillIds((prev) => {
      if (prev.includes(skillId)) {
        setSelectedDetailsBySkill((current) => {
          const next = { ...current };
          delete next[skillId];
          return next;
        });
        return prev.filter((id) => id !== skillId);
      }
      return [...prev, skillId];
    });
  }

  function toggleDetail(skillId: string, detailId: string) {
    setSelectedDetailsBySkill((prev) => {
      const current = prev[skillId] ?? [];
      const nextDetails = current.includes(detailId) ? current.filter((id) => id !== detailId) : [...current, detailId];
      return { ...prev, [skillId]: nextDetails };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        club: club || undefined,
        position: position || undefined,
        age: age ? Number(age) : undefined,
        birthDate: birthDate || undefined,
        dominantFoot: dominantFoot || undefined,
        initialSkills: selectedSkillIds.map((skillId) => ({
          skillId,
          detailIds: selectedDetailsBySkill[skillId] ?? [],
        })),
        discAssignedTo,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Nie udało się dodać zawodnika");
      setLoading(false);
      return;
    }

    const createdId = data?._id ? String(data._id) : "";
    if (discAssignedTo === "admin" && createdId) {
      router.push(`/players/${createdId}/disc`);
      router.refresh();
      return;
    }

    router.push("/players");
    router.refresh();
  }

  return (
    <div className="page-wrap max-w-3xl mx-auto w-full">
      <div className="hero-card">
        <h1 className="page-title">Nowy zawodnik</h1>
        <p className="page-subtitle">Wypelnij podstawowe informacje. Szczegoly treningowe dodasz pozniej.</p>
      </div>

      <form onSubmit={onSubmit} className="surface space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="field-label">Imie</label>
            <input className="field-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="field-label">Nazwisko</label>
            <input className="field-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-1">
          <label className="field-label">Ankieta DISC</label>
          <select className="field-select" value={discAssignedTo} onChange={(e) => setDiscAssignedTo(e.target.value as "player" | "admin")}>
            <option value="player">Wypelnia zawodnik przy 1 logowaniu</option>
            <option value="admin">Wypelniam ja od razu po zapisie</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Klub</label>
            <input className="field-input" value={club} onChange={(e) => setClub(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Pozycja</label>
            <input className="field-input" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Data urodzenia</label>
            <input type="date" className="field-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <label className="text-sm">Lepsza noga</label>
            <select className="field-select" value={dominantFoot} onChange={(e) => setDominantFoot(e.target.value)}>
              <option value="">Wybierz</option>
              <option value="left">Lewa</option>
              <option value="right">Prawa</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleSkillsPicker}
          >
            {showSkillsPicker ? "Ukryj umiejetnosci" : "Dodaj umiejetnosci"}
          </button>

          {showSkillsPicker ? (
            <div className="mt-3 space-y-3">
              {skillsLoading ? <div className="text-sm text-slate-600">Ladowanie umiejetnosci...</div> : null}
              {!skillsLoading && skills.length === 0 ? <div className="text-sm text-slate-600">Brak umiejetnosci do wyboru.</div> : null}
              {skills.map((skill) => {
                const selected = selectedSkillIds.includes(skill._id);
                return (
                  <div key={skill._id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input type="checkbox" checked={selected} onChange={() => toggleSkill(skill._id)} />
                      {skill.name}
                    </label>
                    {selected && (skill.details?.length ?? 0) > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(skill.details ?? []).map((detail) => (
                          <label key={detail._id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                            <input
                              type="checkbox"
                              checked={(selectedDetailsBySkill[skill._id] ?? []).includes(detail._id)}
                              onChange={() => toggleDetail(skill._id, detail._id)}
                            />
                            {detail.name}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2">
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? "Zapisywanie" : "Zapisz"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/players")}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
