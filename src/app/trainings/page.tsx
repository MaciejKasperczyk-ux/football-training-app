import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { Player } from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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
  for (const p of players as any[]) {
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

      <div className="table-wrap">
        <div className="table-head grid grid-cols-12 gap-2 p-3 text-sm font-semibold text-slate-700">
          <div className="col-span-3">Data</div>
          <div className="col-span-4">Zawodnicy</div>
          <div className="col-span-2">Czas (min)</div>
          <div className="col-span-3">Elementy</div>
        </div>

        {trainings.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak treningow</div>
        ) : (
          (trainings as any[]).map((t) => (
            <a key={String(t._id)} href={`/trainings/${String(t._id)}`} className="table-row grid grid-cols-12 gap-2 p-3 text-sm">
              <div className="col-span-3 font-medium">{new Date(t.date).toLocaleDateString("pl-PL")}</div>
              <div className="col-span-4">
                {((t.players ?? []) as string[])
                  .map((pid) => playersMap.get(String(pid)) ?? "Nieznany")
                  .join(", ")}
              </div>
              <div className="col-span-2 text-slate-600">{t.durationMinutes ?? "-"}</div>
              <div className="col-span-3">
                <span className="pill">{t.entries?.length ?? 0}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
