"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DISC_AREAS, DISC_POINTS, DISC_QUESTION_GROUPS, scoreDiscAnswers, type DiscArea } from "@/lib/disc";

type Props = {
  playerId: string;
  readonlyMode?: boolean;
  initialArea?: DiscArea | null;
  initialAnswers?: Record<string, number>;
};

function defaultAnswers() {
  const answers: Record<string, number> = {};
  for (const group of DISC_QUESTION_GROUPS) {
    group.statements.forEach((statement, index) => {
      answers[statement.id] = DISC_POINTS[index];
    });
  }
  return answers;
}

export default function DiscSurveyForm({ playerId, readonlyMode = false, initialArea, initialAnswers }: Props) {
  const router = useRouter();
  const [area, setArea] = useState<DiscArea>(initialArea ?? "sport");
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers && Object.keys(initialAnswers).length ? initialAnswers : defaultAnswers());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewScores = useMemo(() => scoreDiscAnswers(answers), [answers]);

  function setAnswer(statementId: string, points: number) {
    setAnswers((prev) => ({ ...prev, [statementId]: points }));
  }

  function groupInvalid(groupId: string) {
    const group = DISC_QUESTION_GROUPS.find((value) => value.id === groupId);
    if (!group) return false;
    const values = group.statements.map((statement) => Number(answers[statement.id] ?? 0));
    const sorted = [...values].sort((a, b) => b - a);
    return JSON.stringify(sorted) !== JSON.stringify([...DISC_POINTS]);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readonlyMode) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/players/${playerId}/disc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, answers }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ? String(data.error) : "Nie udalo sie zapisac ankiety.");
      return;
    }
    router.push(`/players/${playerId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="surface p-5">
        <h2 className="section-title">Instrukcja</h2>
        <div className="mt-2 text-sm text-slate-700 space-y-1">
          <p>1. Wybierz jeden obszar i trzymaj sie go przez cala ankiete.</p>
          <p>2. W kazdej grupie przydziel punkty 4, 3, 2, 1 (kazdy tylko raz).</p>
          <p>3. Odpowiadaj szczerze, nie ma odpowiedzi dobrych lub zlych.</p>
        </div>
      </div>

      <div className="surface p-5">
        <label className="field-label">Obszar</label>
        <select className="field-select mt-1" value={area} onChange={(event) => setArea(event.target.value as DiscArea)} disabled={readonlyMode}>
          {DISC_AREAS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {DISC_QUESTION_GROUPS.map((group, index) => (
        <div key={group.id} className="surface p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Grupa {index + 1}</h3>
            {groupInvalid(group.id) ? <span className="text-xs text-red-600">Uzyj punktow 4,3,2,1 po jednym razie</span> : null}
          </div>
          <div className="grid gap-2">
            {group.statements.map((statement) => (
              <div key={statement.id} className="surface-muted flex items-center justify-between gap-3 px-3 py-2">
                <div className="text-sm text-slate-800">
                  {statement.text} <span className="text-slate-500">({statement.letter})</span>
                </div>
                <select
                  className="field-select !w-24"
                  value={String(answers[statement.id] ?? 0)}
                  onChange={(event) => setAnswer(statement.id, Number(event.target.value))}
                  disabled={readonlyMode}
                >
                  {DISC_POINTS.map((pts) => (
                    <option key={pts} value={pts}>
                      {pts}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="surface p-5">
        <h2 className="section-title">Podglad punktow</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="surface-muted p-3 text-sm">D: <strong>{previewScores.D}</strong></div>
          <div className="surface-muted p-3 text-sm">I: <strong>{previewScores.I}</strong></div>
          <div className="surface-muted p-3 text-sm">S: <strong>{previewScores.S}</strong></div>
          <div className="surface-muted p-3 text-sm">C: <strong>{previewScores.C}</strong></div>
        </div>
      </div>

      {error ? <div className="text-sm text-red-700">{error}</div> : null}
      {!readonlyMode ? (
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Zapisywanie..." : "Zapisz ankiete"}
        </button>
      ) : null}
    </form>
  );
}
