import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { Player } from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

type TrainingListItem = {
  _id: string;
  date: Date | string;
  players?: string[];
  durationMinutes?: number | null;
  entries?: Array<unknown>;
};

type PlayerListItem = {
  _id: string;
  firstName: string;
  lastName: string;
};

export default async function TrainingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Treningi</h1>
        <div className="text-sm">Brak dostępu</div>
        <Link className="underline text-sm" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  await dbConnect();

  const trainings = await TrainingSession.find().sort({ date: -1 }).lean();
  const players = await Player.find().lean();

  const playersMap = new Map<string, string>();
  for (const p of players as PlayerListItem[]) {
    playersMap.set(String(p._id), `${p.firstName} ${p.lastName}`);
  }

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Treningi</h1>
        <p className="page-subtitle">Pelna historia jednostek treningowych i szybki dostep do raportow.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Zestawienie wszystkich zarejestrowanych treningow</div>
        <Link className="btn btn-primary" href="/trainings/new">
          Dodaj trening
        </Link>
      </div>

      {trainings.length === 0 ? (
        <div className="surface p-4 text-sm text-slate-600">Brak treningow</div>
      ) : (
        <div className="grid gap-3">
          {(trainings as TrainingListItem[]).map((t) => {
            const trainingPlayers = ((t.players ?? []) as string[]).map((pid) => playersMap.get(String(pid)) ?? "Nieznany");
            return (
              <Link
                key={String(t._id)}
                href={`/trainings/${String(t._id)}`}
                className="surface w-full p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm text-slate-500">Data treningu</div>
                    <div className="text-base font-semibold">{new Date(t.date).toLocaleDateString("pl-PL")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pill">{t.entries?.length ?? 0} elementow</span>
                    <span className="pill">{t.durationMinutes ? `${t.durationMinutes} min` : "bez czasu"}</span>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-500">Zawodnicy</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trainingPlayers.length === 0 ? (
                    <span className="text-sm text-slate-600">Brak zawodnikow</span>
                  ) : (
                    trainingPlayers.map((name, idx) => (
                      <span key={`${name}-${idx}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {name}
                      </span>
                    ))
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
