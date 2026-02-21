"use client";

import { useState } from "react";

type ApiResult = Record<string, unknown> | null;

export default function AdminTestDataPage() {
  const [playersToGenerate, setPlayersToGenerate] = useState(5);
  const [trainingsToSimulate, setTrainingsToSimulate] = useState(8);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "wipe_players" | "generate_players" | "simulate_trainings", count?: number) {
    setLoadingAction(action);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, count }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ? JSON.stringify(data.error) : "Nie udalo sie wykonac operacji.");
        return;
      }

      setResult(data);
    } catch {
      setError("Blad polaczenia z API.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="page-wrap max-w-5xl">
      <div className="hero-card">
        <h1 className="page-title">Admin - test data</h1>
        <p className="page-subtitle">Narzędzia do szybkiego testowania: reset danych, generator zawodnikow i symulacje treningow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="surface p-4">
          <div className="section-title">Reset zawodnikow</div>
          <p className="section-copy">Usuwa wszystkich zawodnikow oraz ich treningi, cele i przypisane umiejetnosci.</p>
          <button
            className="btn btn-danger mt-4 w-full"
            disabled={loadingAction !== null}
            onClick={() => {
              if (!confirm("Na pewno usunac wszystkich zawodnikow i powiazane dane testowe?")) return;
              runAction("wipe_players");
            }}
          >
            {loadingAction === "wipe_players" ? "Usuwanie..." : "Usun wszystkich zawodnikow"}
          </button>
        </section>

        <section className="surface p-4">
          <div className="section-title">Generator zawodnikow</div>
          <p className="section-copy">Tworzy losowych zawodnikow z podstawowymi umiejetnosciami i celami.</p>
          <label className="field-label mt-3">Liczba zawodnikow</label>
          <input
            className="field-input"
            min={1}
            max={100}
            type="number"
            value={playersToGenerate}
            onChange={(event) => setPlayersToGenerate(Number(event.target.value))}
          />
          <button
            className="btn btn-primary mt-4 w-full"
            disabled={loadingAction !== null}
            onClick={() => runAction("generate_players", playersToGenerate)}
          >
            {loadingAction === "generate_players" ? "Generowanie..." : "Wygeneruj zawodnikow"}
          </button>
        </section>

        <section className="surface p-4">
          <div className="section-title">Symuluj treningi</div>
          <p className="section-copy">Dodaje treningi grupowe i losowo aktualizuje podumiejetnosci zawodnikow.</p>
          <label className="field-label mt-3">Liczba treningow</label>
          <input
            className="field-input"
            min={1}
            max={200}
            type="number"
            value={trainingsToSimulate}
            onChange={(event) => setTrainingsToSimulate(Number(event.target.value))}
          />
          <button
            className="btn btn-primary mt-4 w-full"
            disabled={loadingAction !== null}
            onClick={() => runAction("simulate_trainings", trainingsToSimulate)}
          >
            {loadingAction === "simulate_trainings" ? "Symulowanie..." : "Symuluj treningi"}
          </button>
        </section>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="surface p-4">
          <div className="section-title">Wynik operacji</div>
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
