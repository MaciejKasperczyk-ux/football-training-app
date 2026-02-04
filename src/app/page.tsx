import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { Goal } from "@/models/Goal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDatePL(value: Date) {
  return value.toLocaleDateString("pl-PL");
}

function statusLabel(status: string) {
  if (status === "planned") return "plan";
  if (status === "in_progress") return "w trakcie";
  if (status === "done") return "zrobione";
  return status;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Użytkownik";

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-semibold tracking-tight">Panel</div>
        <div className="mt-2 text-sm text-slate-600">Brak dostępu</div>
        <Link className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  await dbConnect();

  const playersCount = await Player.countDocuments();
  const trainingsCount = await TrainingSession.countDocuments();

  const today = startOfToday();
  const last7 = addDays(today, -7);
  const next14 = addDays(today, 14);

  const trainingsLast7 = await TrainingSession.countDocuments({ date: { $gte: last7 } });

  const goalsOverdue = await Goal.countDocuments({
    status: { $ne: "done" },
    dueDate: { $lt: today },
  });

  const goalsNext14 = await Goal.find({
    status: { $ne: "done" },
    dueDate: { $gte: today, $lte: next14 },
  })
    .sort({ dueDate: 1 })
    .limit(6)
    .lean();

  const players = await Player.find().sort({ lastName: 1, firstName: 1 }).limit(6).lean();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-600">Witaj</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{name}</div>
        <div className="mt-2 text-sm text-slate-600">
          Szybki podgląd: zawodnicy, treningi oraz cele z terminami.
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/players/new">
            Dodaj zawodnika
          </Link>
          <Link className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href="/trainings/new">
            Dodaj trening
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Zawodnicy</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{playersCount}</div>
          <div className="mt-2 text-sm text-slate-600">Baza zawodników w systemie</div>
          <Link className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href="/players">
            Otwórz listę
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Treningi</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{trainingsCount}</div>
          <div className="mt-2 text-sm text-slate-600">Ostatnie 7 dni: {trainingsLast7}</div>
          <Link className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href="/trainings">
            Zobacz treningi
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Cele przeterminowane</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{goalsOverdue}</div>
          <div className="mt-2 text-sm text-slate-600">Do nadrobienia w profilach</div>
          <Link className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href="/players">
            Przejdź do zawodników
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Skróty</div>
          <div className="mt-3 grid gap-2">
            <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/players/new">
              Nowy zawodnik
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href="/trainings/new">
              Nowy trening
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href="/tests">
              Testy i pomiary
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-lg font-semibold tracking-tight">Najbliższe terminy celów</div>
            <div className="mt-1 text-sm text-slate-600">Najbliższe 14 dni</div>
          </div>

          <div className="p-5">
            {goalsNext14.length === 0 ? (
              <div className="text-sm text-slate-600">Brak celów z terminem w najbliższych 14 dniach</div>
            ) : (
              <div className="grid gap-3">
                {goalsNext14.map((g: any) => (
                  <div key={String(g._id)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{g.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Termin: {formatDatePL(new Date(g.dueDate))} , status: {statusLabel(g.status)}
                      </div>
                    </div>
                    <Link className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href={`/players/${String(g.playerId)}`}>
                      Profil
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-lg font-semibold tracking-tight">Zawodnicy</div>
            <div className="mt-1 text-sm text-slate-600">Szybki dostęp do profili</div>
          </div>

          <div className="p-5">
            {players.length === 0 ? (
              <div className="text-sm text-slate-600">Brak zawodników</div>
            ) : (
              <div className="grid gap-3">
                {players.map((p: any) => (
                  <div key={String(p._id)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {(p.club ?? "").trim() ? p.club : "Brak klubu"}
                        {p.position ? ` , ${p.position}` : ""}
                      </div>
                    </div>
                    <Link className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href={`/players/${String(p._id)}`}>
                      Profil
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Link className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/players">
                Przejdź do listy zawodników
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
