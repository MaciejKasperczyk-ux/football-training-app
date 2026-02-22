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

type TrainingViewModel = TrainingListItem & {
  dateObj: Date;
  isUpcoming: boolean;
  isToday: boolean;
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
  const role = (session.user as { role?: string; playerId?: string | null } | undefined)?.role;
  const ownPlayerId = (session.user as { role?: string; playerId?: string | null } | undefined)?.playerId;

  const trainings =
    role === "player"
      ? ownPlayerId
        ? await TrainingSession.find({ players: ownPlayerId }).sort({ date: -1 }).lean()
        : []
      : await TrainingSession.find().sort({ date: -1 }).lean();
  const players = await Player.find().lean();

  const playersMap = new Map<string, string>();
  for (const p of players as PlayerListItem[]) {
    playersMap.set(String(p._id), `${p.firstName} ${p.lastName}`);
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const trainingItems = (trainings as TrainingListItem[]).map((t) => {
    const dateObj = new Date(t.date);
    const trainingDay = new Date(dateObj);
    trainingDay.setHours(0, 0, 0, 0);
    const isUpcoming = trainingDay.getTime() >= todayStart.getTime();
    const isToday = trainingDay.getTime() === todayStart.getTime();

    return { ...t, dateObj, isUpcoming, isToday } satisfies TrainingViewModel;
  });

  const upcomingTrainings = [...trainingItems]
    .filter((t) => t.isUpcoming)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const pastTrainings = [...trainingItems]
    .filter((t) => !t.isUpcoming)
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  const totalEntries = trainingItems.reduce((sum, t) => sum + (t.entries?.length ?? 0), 0);

  function getScheduleLabel(training: TrainingViewModel) {
    if (training.isToday) {
      return {
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
        label: "Dzis",
        hint: "Zaplanowany na dzisiaj",
      };
    }

    if (training.isUpcoming) {
      const dayDiff = Math.ceil((training.dateObj.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      return {
        badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
        label: "Zaplanowany",
        hint: dayDiff === 1 ? "Jutro" : `Za ${dayDiff} dni`,
      };
    }

    const dayDiff = Math.ceil((todayStart.getTime() - training.dateObj.getTime()) / (1000 * 60 * 60 * 24));
    return {
      badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
      label: "Odbyty",
      hint: dayDiff <= 1 ? "Wczoraj" : `${dayDiff} dni temu`,
    };
  }

  function renderTrainingCard(t: TrainingViewModel) {
    const trainingPlayers = ((t.players ?? []) as string[]).map((pid) => playersMap.get(String(pid)) ?? "Nieznany");
    const status = getScheduleLabel(t);

    return (
      <article
        key={String(t._id)}
        className={`surface w-full p-4 transition-colors ${t.isUpcoming ? "border-sky-200/80" : "border-slate-200"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}>
                {status.label}
              </span>
              <span className="text-xs font-medium text-slate-500">{status.hint}</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Data treningu</div>
              <div className="text-base font-semibold text-slate-900">{t.dateObj.toLocaleDateString("pl-PL")}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{t.entries?.length ?? 0} elementow</span>
            <span className="pill">{t.durationMinutes ? `${t.durationMinutes} min` : "bez czasu"}</span>
            <span className="pill">{trainingPlayers.length} zawodnikow</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zawodnicy</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {trainingPlayers.length === 0 ? (
              <span className="text-sm text-slate-600">Brak zawodnikow</span>
            ) : (
              trainingPlayers.map((name, idx) => (
                <span
                  key={`${name}-${idx}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {name}
                </span>
              ))
            )}
          </div>
        </div>

        {role === "admin" || role === "trainer" ? (
          <div className="mt-3 flex justify-end">
            <Link className="btn btn-secondary" href={`/trainings/${String(t._id)}`}>
              Raport i szczegoly
            </Link>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Treningi</h1>
        <p className="page-subtitle">Pelna historia jednostek treningowych i szybki dostep do raportow.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Zestawienie wszystkich zarejestrowanych treningow</div>
        {role === "admin" || role === "trainer" ? (
          <Link className="btn btn-primary" href="/trainings/new">
            Dodaj trening
          </Link>
        ) : null}
      </div>

      {trainingItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Wszystkie treningi</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{trainingItems.length}</div>
          </div>
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Zaplanowane</div>
            <div className="mt-1 text-2xl font-semibold text-sky-700">{upcomingTrainings.length}</div>
          </div>
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Odbyte</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{pastTrainings.length}</div>
          </div>
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Elementy treningowe</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{totalEntries}</div>
          </div>
        </div>
      ) : null}

      {trainings.length === 0 ? (
        <div className="surface p-4 text-sm text-slate-600">Brak treningow</div>
      ) : (
        <div className="grid gap-4">
          <section className="surface p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="section-title">Zaplanowane treningi</h2>
                <p className="section-copy">Najblizsze jednostki do realizacji. Pokazywane od najblizszego terminu.</p>
              </div>
              <span className="pill">{upcomingTrainings.length}</span>
            </div>

            {upcomingTrainings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Brak zaplanowanych treningow.
              </div>
            ) : (
              <div className="grid gap-3">{upcomingTrainings.map((t) => renderTrainingCard(t))}</div>
            )}
          </section>

          <section className="surface p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="section-title">Odbyte treningi</h2>
                <p className="section-copy">Historia wykonanych jednostek. Najnowsze sa na gorze.</p>
              </div>
              <span className="pill">{pastTrainings.length}</span>
            </div>

            {pastTrainings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Brak odbytych treningow.
              </div>
            ) : (
              <div className="grid gap-3">{pastTrainings.map((t) => renderTrainingCard(t))}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
