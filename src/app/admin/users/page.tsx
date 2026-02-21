"use client";

import { useState } from "react";

type ResultState = { type: "success" | "error"; message: string } | null;

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "trainer" | "viewer">("trainer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  const [playersToGenerate, setPlayersToGenerate] = useState(8);
  const [trainingsToSimulate, setTrainingsToSimulate] = useState(12);
  const [toolsLoading, setToolsLoading] = useState<string | null>(null);
  const [toolsResult, setToolsResult] = useState<Record<string, unknown> | null>(null);
  const [toolsError, setToolsError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResult({
          type: "error",
          message: data?.error ? JSON.stringify(data.error) : "Nie udalo sie utworzyc uzytkownika.",
        });
        return;
      }

      setResult({
        type: "success",
        message: `Utworzono: ${data.email} (${data.role})`,
      });
      setEmail("");
      setName("");
      setPassword("");
      setRole("trainer");
    } finally {
      setLoading(false);
    }
  }

  async function runTool(action: "wipe_players" | "generate_players" | "simulate_trainings", count?: number) {
    setToolsLoading(action);
    setToolsError(null);
    setToolsResult(null);

    try {
      const res = await fetch("/api/admin/test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, count }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setToolsError(data?.error ? JSON.stringify(data.error) : "Nie udalo sie wykonac operacji.");
        return;
      }

      setToolsResult(data);
    } catch {
      setToolsError("Blad polaczenia z API.");
    } finally {
      setToolsLoading(null);
    }
  }

  function downloadExport(dataset: "players" | "trainings" | "skills" | "goals" | "player-skills") {
    window.open(`/api/admin/exports?dataset=${dataset}`, "_blank");
  }

  return (
    <div className="page-wrap max-w-6xl">
      <div className="hero-card">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Zarzadzanie kontami oraz dane testowe do szybkiego QA.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <h2 className="section-title">Nowy uzytkownik</h2>
          <p className="section-copy">Tworzenie kont i nadawanie rol dostepowych.</p>

          <form onSubmit={onSubmit} className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <label className="field-label">Adres e-mail</label>
              <input
                className="field-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="grid gap-1">
              <label className="field-label">Imie i nazwisko</label>
              <input
                className="field-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jan Kowalski"
                required
              />
            </div>

            <div className="grid gap-1">
              <label className="field-label">Haslo startowe</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Min. 8 znakow"
                required
              />
            </div>

            <div className="grid gap-1">
              <label className="field-label">Rola</label>
              <select className="field-select" value={role} onChange={(event) => setRole(event.target.value as "admin" | "trainer" | "viewer")}>
                <option value="trainer">Trener</option>
                <option value="viewer">Przegladajacy</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button disabled={loading} className="btn btn-primary mt-2" type="submit">
              {loading ? "Tworzenie..." : "Utworz konto"}
            </button>
          </form>

          {result ? (
            <div
              className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                result.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {result.message}
            </div>
          ) : null}
        </section>

        <section className="surface p-5">
          <h2 className="section-title">Dane testowe</h2>
          <p className="section-copy">Generator i czyszczenie danych do testowania aplikacji.</p>

          <div className="mt-4 grid gap-4">
            <div className="surface-muted p-3">
              <div className="text-sm font-semibold text-slate-800">Usun wszystkich zawodnikow</div>
              <p className="mt-1 text-xs text-slate-600">Czyści zawodnikow, cele, player-skills i treningi.</p>
              <button
                className="btn btn-danger mt-3 w-full"
                disabled={toolsLoading !== null}
                onClick={() => {
                  if (!confirm("Na pewno usunac wszystkich zawodnikow i ich dane?")) return;
                  runTool("wipe_players");
                }}
              >
                {toolsLoading === "wipe_players" ? "Usuwanie..." : "Wykonaj reset"}
              </button>
            </div>

            <div className="surface-muted p-3">
              <div className="text-sm font-semibold text-slate-800">Wygeneruj zawodnikow</div>
              <p className="mt-1 text-xs text-slate-600">Tworzy zawodnikow z data urodzenia, losowymi trenerami i podumiejetnosciami.</p>
              <label className="field-label mt-3">Liczba</label>
              <input
                className="field-input"
                type="number"
                min={1}
                max={100}
                value={playersToGenerate}
                onChange={(event) => setPlayersToGenerate(Number(event.target.value))}
              />
              <button
                className="btn btn-primary mt-3 w-full"
                disabled={toolsLoading !== null}
                onClick={() => runTool("generate_players", playersToGenerate)}
              >
                {toolsLoading === "generate_players" ? "Generowanie..." : "Generuj zawodnikow"}
              </button>
            </div>

            <div className="surface-muted p-3">
              <div className="text-sm font-semibold text-slate-800">Symuluj treningi</div>
              <p className="mt-1 text-xs text-slate-600">Tworzy treningi i mocniej aktualizuje progres podumiejetnosci.</p>
              <label className="field-label mt-3">Liczba treningow</label>
              <input
                className="field-input"
                type="number"
                min={1}
                max={200}
                value={trainingsToSimulate}
                onChange={(event) => setTrainingsToSimulate(Number(event.target.value))}
              />
              <button
                className="btn btn-primary mt-3 w-full"
                disabled={toolsLoading !== null}
                onClick={() => runTool("simulate_trainings", trainingsToSimulate)}
              >
                {toolsLoading === "simulate_trainings" ? "Symulowanie..." : "Symuluj treningi"}
              </button>
            </div>
          </div>

          {toolsError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{toolsError}</div>
          ) : null}

          {toolsResult ? (
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
              {JSON.stringify(toolsResult, null, 2)}
            </pre>
          ) : null}

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="text-sm font-semibold text-slate-800">Eksport do Excela (CSV)</div>
            <p className="mt-1 text-xs text-slate-600">Pliki CSV mozna od razu otworzyc w Excelu.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" className="btn btn-secondary" onClick={() => downloadExport("players")}>
                Pobierz zawodnikow
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => downloadExport("trainings")}>
                Pobierz treningi
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => downloadExport("skills")}>
                Pobierz umiejetnosci
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => downloadExport("goals")}>
                Pobierz cele
              </button>
              <button type="button" className="btn btn-secondary sm:col-span-2" onClick={() => downloadExport("player-skills")}>
                Pobierz postepy umiejetnosci zawodnikow
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
