import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { Goal } from "@/models/Goal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

function Icon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      {children}
    </svg>
  );
}

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
            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              <Icon>
                <path d="M16 19a4 4 0 0 0-8 0" />
                <circle cx="12" cy="11" r="3.25" />
                <path d="M7.5 19a3 3 0 0 0-3-3" />
                <circle cx="6.5" cy="12" r="2.25" />
                <path d="M16.5 19a3 3 0 0 1 3-3" />
                <circle cx="17.5" cy="12" r="2.25" />
              </Icon>
            </div>
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
            <div className="rounded-lg bg-orange-100 p-3 text-orange-700">
              <Icon>
                <circle cx="12" cy="12" r="6.5" />
                <path d="M12 5.5v13" />
                <path d="M5.5 12h13" />
              </Icon>
            </div>
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
            <div className={`rounded-lg p-3 ${goalsOverdue > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {goalsOverdue > 0 ? (
                <Icon>
                  <path d="m12 4 8 14H4l8-14Z" />
                  <path d="M12 9v4" />
                  <circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
                </Icon>
              ) : (
                <Icon>
                  <circle cx="12" cy="12" r="8" />
                  <path d="m8.5 12.5 2.4 2.4 4.6-5.1" />
                </Icon>
              )}
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
              <span className="text-slate-700">
                <Icon className="h-4 w-4">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </Icon>
              </span>
              Nowy zawodnik
            </Link>
            <Link className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200" href="/trainings/new">
              <span className="text-slate-700">
                <Icon className="h-4 w-4">
                  <rect x="6.5" y="5.5" width="11" height="13" rx="1.5" />
                  <path d="M9 9.5h6" />
                  <path d="M9 12.5h6" />
                </Icon>
              </span>
              Nowy trening
            </Link>
            <Link className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200" href="/skills">
              <span className="text-slate-700">
                <Icon className="h-4 w-4">
                  <path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z" />
                </Icon>
              </span>
              Umiejętności
            </Link>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Goals */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="text-slate-600">
                <Icon>
                  <rect x="4.5" y="6.5" width="15" height="12" rx="2" />
                  <path d="M8 4.5v4" />
                  <path d="M16 4.5v4" />
                  <path d="M4.5 10.5h15" />
                </Icon>
              </span>
              Najbliższe cele
            </div>
            <div className="mt-1 text-sm text-slate-600">Terminy w ciągu 14 dni</div>
          </div>

          <div className="p-6">
            {goalsNext14.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 text-slate-400">
                  <Icon className="h-9 w-9">
                    <circle cx="12" cy="12" r="7.5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="12" cy="12" r="1.8" />
                  </Icon>
                </div>
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
                    <div className="text-slate-400 group-hover:text-blue-600">
                      <Icon className="h-5 w-5">
                        <path d="M5 12h12" />
                        <path d="m13 7 5 5-5 5" />
                      </Icon>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Players */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="text-slate-600">
                <Icon>
                  <path d="M16 19a4 4 0 0 0-8 0" />
                  <circle cx="12" cy="11" r="3.25" />
                </Icon>
              </span>
              Zawodnicy
            </div>
            <div className="mt-1 text-sm text-slate-600">Szybki dostęp</div>
          </div>

          <div className="p-6">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 text-slate-400">
                  <Icon className="h-9 w-9">
                    <path d="M16 19a4 4 0 0 0-8 0" />
                    <circle cx="12" cy="11" r="3.25" />
                    <path d="M7.5 18.5a3 3 0 0 0-3-2.8" />
                    <circle cx="6.5" cy="12.5" r="2.1" />
                  </Icon>
                </div>
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
                    <div className="text-slate-400 group-hover:text-blue-600">
                      <Icon className="h-5 w-5">
                        <path d="M5 12h12" />
                        <path d="m13 7 5 5-5 5" />
                      </Icon>
                    </div>
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
