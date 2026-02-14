import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { Goal } from "@/models/Goal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

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

function getStatusColor(status: string) {
  if (status === "planned") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "in_progress") return "bg-orange-100 text-orange-700 border-orange-200";
  if (status === "done") return "bg-green-100 text-green-700 border-green-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "Użytkownik";
  const role = (session?.user as { role?: string; playerId?: string | null } | undefined)?.role;
  const playerId = (session?.user as { role?: string; playerId?: string | null } | undefined)?.playerId;

  if (!session?.user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="text-3xl font-bold tracking-tight text-slate-900">Witaj w Futbolucja</div>
        <div className="mt-2 text-base text-slate-600">Zaloguj się, aby uzyskać dostęp do panelu</div>
        <Link className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  if (role === "player" && playerId) {
    redirect(`/players/${playerId}`);
  }
  if (role === "player" && !playerId) {
    return (
      <div className="surface p-6">
        <div className="page-title">Panel zawodnika</div>
        <div className="mt-2 text-sm text-slate-600">
          Konto zawodnika nie jest jeszcze przypisane do profilu. Skontaktuj sie z administratorem.
        </div>
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
      {/* Hero Section */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10">
          <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Witaj z powrotem</div>
          <div className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{name}</div>
          <div className="mt-3 text-base text-slate-600">
            Zarządzaj zawodnikami, treningami i śledź postępy w osiąganiu celów.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all" href="/players/new">
              + Dodaj zawodnika
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all" href="/trainings/new">
              + Zaplanuj trening
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Players Card */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Zawodnicy</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{playersCount}</div>
              <div className="mt-2 text-xs text-slate-500">W bazie danych</div>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 text-xl">👥</div>
          </div>
          <Link className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors" href="/players">
            Przejdź do listy
          </Link>
        </div>

        {/* Trainings Card */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Treningi</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{trainingsCount}</div>
              <div className="mt-2 text-xs text-slate-500">Ostatnie 7 dni: {trainingsLast7}</div>
            </div>
            <div className="rounded-lg bg-orange-100 p-3 text-xl">⚽</div>
          </div>
          <Link className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors" href="/trainings">
            Wszystkie treningi
          </Link>
        </div>

        {/* Overdue Goals Card */}
        <div className={`group rounded-2xl border-2 bg-white p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer ${goalsOverdue > 0 ? "border-red-200 hover:border-red-300" : "border-slate-200 hover:border-green-200"}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Cele przeterminowane</div>
              <div className={`mt-2 text-3xl font-bold ${goalsOverdue > 0 ? "text-red-600" : "text-green-600"}`}>
                {goalsOverdue}
              </div>
              <div className="mt-2 text-xs text-slate-500">Wymagają uwagi</div>
            </div>
            <div className={`rounded-lg p-3 text-xl ${goalsOverdue > 0 ? "bg-red-100" : "bg-green-100"}`}>
              {goalsOverdue > 0 ? "⚠️" : "✅"}
            </div>
          </div>
          <Link className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors" href="/players">
            Przejrzyj zawodników
          </Link>
        </div>

        {/* Quick Links Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600 mb-4">Szybkie akcje</div>
          <div className="space-y-2">
            <Link className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200" href="/players/new">
              <span>➕</span> Nowy zawodnik
            </Link>
            <Link className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200" href="/trainings/new">
              <span>📋</span> Nowy trening
            </Link>
            <Link className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200" href="/skills">
              <span>⭐</span> Umiejętności
            </Link>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Goals */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="text-lg font-bold text-slate-900">📅 Najbliższe cele</div>
            <div className="mt-1 text-sm text-slate-600">Terminy w ciągu 14 dni</div>
          </div>

          <div className="p-6">
            {goalsNext14.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-sm text-slate-600">Brak celów z terminem w najbliższych 14 dniach</div>
              </div>
            ) : (
              <div className="space-y-3">
                {goalsNext14.map((g: any) => (
                  <Link key={String(g._id)} href={`/players/${String(g.playerId)}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 hover:bg-slate-100 hover:border-blue-200 transition-all group">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{g.title}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(g.status)}`}>
                          {statusLabel(g.status)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDatePL(new Date(g.dueDate))}
                        </span>
                      </div>
                    </div>
                    <div className="text-lg">→</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Players */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="text-lg font-bold text-slate-900">⭐ Zawodnicy</div>
            <div className="mt-1 text-sm text-slate-600">Szybki dostęp</div>
          </div>

          <div className="p-6">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-sm text-slate-600">Brak zawodników w bazie</div>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((p: any) => (
                  <Link key={String(p._id)} href={`/players/${String(p._id)}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 hover:border-blue-200 transition-all group">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {(p.club ?? "").trim() ? p.club : "—"}
                        {p.position ? ` • ${p.position}` : ""}
                      </div>
                    </div>
                    <div className="text-lg text-slate-400 group-hover:text-blue-600">→</div>
                  </Link>
                ))}

                <Link className="mt-4 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all" href="/players">
                  Pełna lista zawodników
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
