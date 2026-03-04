import Image from "next/image";
import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { PlayerSkill } from "@/models/PlayerSkill";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { type AppRole } from "@/lib/auth";
import DeletePlayerButton from "@/components/players/DeletePlayerButton";
import EditPlayerPanel from "@/components/players/EditPlayerPanel";
import PlayerSkillsManager from "@/components/players/PlayerSkillsManager";
import PlayerGoals from "@/components/players/PlayerGoals";
import PlayerSkillsRadar from "@/components/players/PlayerSkillsRadar";
import PlayerAccountPanel from "@/components/players/PlayerAccountPanel";
import DiscProfileChart from "@/components/players/DiscProfileChart";

type PageProps = { params: Promise<{ id: string }> };
type SkillItem = { _id: unknown; name: string; details?: unknown[] };
type PlayerSkillItem = { skillId: unknown; detailId?: unknown | null; status?: string };
type SessionUser = { role?: AppRole; playerId?: string | null; id?: string | null } & Record<string, unknown>;
type PlayerProfile = {
  _id: unknown;
  firstName: string;
  lastName: string;
  photo?: string | null;
  birthDate?: Date | string | null;
  age?: number | null;
  club?: string | null;
  position?: string | null;
  dominantFoot?: string | null;
  discAssignedTo?: "player" | "admin";
  discStatus?: "pending" | "completed";
  discScores?: { D?: number; I?: number; S?: number; C?: number } | null;
};
type TrainingItem = {
  _id: unknown;
  date: Date | string;
  durationMinutes?: number | null;
  goal?: string | null;
  notes?: string | null;
  entries?: unknown[];
};

function ageFromBirthDate(birthDate?: Date | string | null) {
  if (!birthDate) return null;
  const now = new Date();
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const month = now.getMonth() - b.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function dominantFootLabel(value?: string | null) {
  if (!value) return "-";
  if (value === "left") return "Lewa";
  if (value === "right") return "Prawa";
  if (value === "both") return "Obie";
  return value;
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "Z";
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="surface p-6">
        <div className="page-title">Profil zawodnika</div>
        <div className="mt-2 text-sm text-slate-600">Brak dostepu</div>
        <Link className="btn btn-primary mt-4" href="/login">
          Przejdz do logowania
        </Link>
      </div>
    );
  }

  const sessionUser = session.user as SessionUser;
  const role = sessionUser.role;
  const canManage = role === "admin" || role === "trainer";
  if (role === "player" && String(sessionUser.playerId ?? "") !== String(id)) {
    return (
      <div className="surface p-6">
        <div className="page-title">Profil zawodnika</div>
        <div className="mt-2 text-sm text-slate-600">Brak dostepu do tego profilu.</div>
      </div>
    );
  }

  await dbConnect();

  const player = await Player.findById(id).populate("trainers").lean();
  if (!player) {
    return (
      <div className="page-wrap">
        <Link className="btn btn-secondary w-fit" href="/players">
          Wroc
        </Link>
        <div className="text-sm text-slate-700">Nie znaleziono zawodnika.</div>
      </div>
    );
  }

  if (role === "club_trainer") {
    const ownUserId = String(sessionUser.id ?? "");
    const assigned = ((player as { trainers?: unknown[] }).trainers ?? []).some((trainer) => {
      if (typeof trainer === "string") return trainer === ownUserId;
      if (trainer && typeof trainer === "object" && "_id" in trainer) return String((trainer as { _id?: unknown })._id) === ownUserId;
      return false;
    });
    if (!assigned) {
      return (
        <div className="surface p-6">
          <div className="page-title">Profil zawodnika</div>
          <div className="mt-2 text-sm text-slate-600">Brak dostepu do tego profilu.</div>
        </div>
      );
    }
  }

  const trainings = await TrainingSession.find({ players: player._id }).sort({ date: -1 }).lean();
  const skills = await Skill.find().lean();
  const playerSkills = await PlayerSkill.find({ playerId: player._id }).lean();
  const playerProfile = player as PlayerProfile;
  const completedDetailBySkill = new Map<string, Set<string>>();

  for (const ps of playerSkills as PlayerSkillItem[]) {
    if (ps.status !== "zrobione") continue;

    const skillId = String(ps.skillId);
    const detailKey = ps.detailId ? String(ps.detailId) : "__main__";
    if (!completedDetailBySkill.has(skillId)) completedDetailBySkill.set(skillId, new Set<string>());
    completedDetailBySkill.get(skillId)?.add(detailKey);
  }

  const age = ageFromBirthDate(playerProfile.birthDate) ?? playerProfile.age ?? null;
  const skillProgress = (skills as SkillItem[]).map((skill) => {
    const skillId = String(skill._id);
    const detailIds = (skill.details ?? []).map((detailId) => String(detailId));
    const doneSet = completedDetailBySkill.get(skillId) ?? new Set<string>();

    const total = detailIds.length > 0 ? detailIds.length : 1;
    const done =
      detailIds.length > 0
        ? detailIds.filter((detailId) => doneSet.has(detailId)).length
        : doneSet.has("__main__")
          ? 1
          : 0;

    const ratio = total > 0 ? done / total : 0;
    return {
      id: skillId,
      name: skill.name,
      done,
      total,
      ratio,
      score: ratio * 5,
    };
  });
  const trainingsList = trainings as TrainingItem[];
  const overallSkillRatio = skillProgress.length > 0 ? skillProgress.reduce((sum, skill) => sum + skill.ratio, 0) / skillProgress.length : 0;
  const completedSkills = skillProgress.filter((skill) => skill.ratio >= 1).length;
  const completedTrainings = trainingsList.filter((training) => (training.entries?.length ?? 0) > 0).length;
  const recentTraining = trainingsList[0];
  const playerInitials = initials(player.firstName, player.lastName);
  const dominantFoot = dominantFootLabel(playerProfile.dominantFoot);
  const discScoresRaw = playerProfile.discScores ?? {};
  const discScores = {
    D: Number(discScoresRaw.D ?? 0),
    I: Number(discScoresRaw.I ?? 0),
    S: Number(discScoresRaw.S ?? 0),
    C: Number(discScoresRaw.C ?? 0),
  };
  const discStatus = playerProfile.discStatus ?? "pending";
  const discAssignedTo = playerProfile.discAssignedTo ?? "player";

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              {playerProfile.photo ? (
                <Image
                  src={playerProfile.photo}
                  alt={`Zdjecie ${player.firstName} ${player.lastName}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-300/40 to-blue-400/30 text-2xl font-bold text-white">
                  {playerInitials}
                </div>
              )}
            </div>
            <div>
              <h1 className="page-title">{player.firstName} {player.lastName}</h1>
              <p className="page-subtitle">Najwazniejsze informacje i postep zawodnika.</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-100">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Wiek: {age ?? "-"}</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Pozycja: {playerProfile.position ?? "-"}</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Klub: {playerProfile.club ?? "-"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-secondary" href="/players">
              Wroc do listy
            </Link>
            {canManage ? <DeletePlayerButton playerId={String(playerProfile._id)} /> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Treningi</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{trainingsList.length}</div>
        </div>
        <div className="surface p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Umiejetnosci zakonczone</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{completedSkills}/{skillProgress.length}</div>
        </div>
        <div className="surface p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Sredni postep</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{Math.round(overallSkillRatio * 100)}%</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {canManage ? (
            <details className="surface p-3" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Dane zawodnika</summary>
              <div className="mt-3">
                <EditPlayerPanel player={playerProfile} playerId={String(playerProfile._id)} />
              </div>
            </details>
          ) : null}

          <details className="surface p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Umiejetnosci</summary>
            <div className="mt-3">
              <PlayerSkillsManager playerId={String(playerProfile._id)} canManage={canManage} />
            </div>
          </details>

          <details className="surface p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Cele</summary>
            <div className="mt-3">
              <PlayerGoals playerId={String(playerProfile._id)} canManage={canManage} />
            </div>
          </details>

          <details className="surface p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Ostatnie treningi</summary>
            <div className="mt-3 px-2 pb-2">
            <div className="mb-3">
              <p className="section-copy">Maksymalnie 8 ostatnich wpisow.</p>
            </div>

            {trainingsList.length === 0 ? (
              <div className="text-sm text-slate-600">Brak treningow.</div>
            ) : (
              <div className="grid gap-2">
                {trainingsList.slice(0, 8).map((training) => (
                  <div key={String(training._id)} className="surface-muted p-3">
                    <div className="text-sm font-semibold">
                      {new Date(training.date).toLocaleDateString("pl-PL")}
                      {training.durationMinutes ? ` - ${training.durationMinutes} min` : ""}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Cel: {training.goal?.trim() ? training.goal : "-"} | Elementy: {training.entries?.length ?? 0}
                    </div>
                    {canManage ? (
                      <Link className="btn btn-secondary mt-3 w-fit" href={`/trainings/${String(training._id)}`}>
                        Szczegoly
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            </div>
          </details>
        </div>

        <div className="space-y-4">
          <details className="surface p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Radar umiejetnosci</summary>
            <div className="mt-3">
              <PlayerSkillsRadar data={skillProgress} />
            </div>
          </details>

          <details className="surface p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Model DISC</summary>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Status: <strong>{discStatus === "completed" ? "wypelniona" : "oczekuje"}</strong></span>
                <span className="text-xs text-slate-500">Wypelnia: {discAssignedTo === "player" ? "zawodnik" : "trener/admin"}</span>
              </div>
              <Link className="btn btn-secondary w-fit" href={`/players/${String(playerProfile._id)}/disc`}>
                {discStatus === "completed" ? "Otworz ankiete DISC" : "Wypelnij ankiete DISC"}
              </Link>
              {discStatus === "completed" ? <DiscProfileChart scores={discScores} /> : null}
            </div>
          </details>

          <details className="surface p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Szybkie podsumowanie</summary>
            <div className="mt-3 px-2 pb-2">
            <h2 className="section-title">Szybkie podsumowanie</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="surface-muted flex items-center justify-between px-3 py-2">
                <span className="text-slate-600">Lepsza noga</span>
                <span className="font-semibold text-slate-900">{dominantFoot}</span>
              </div>
              <div className="surface-muted flex items-center justify-between px-3 py-2">
                <span className="text-slate-600">Zakonczone treningi</span>
                <span className="font-semibold text-slate-900">{completedTrainings}</span>
              </div>
              <div className="surface-muted flex items-center justify-between px-3 py-2">
                <span className="text-slate-600">Ostatni trening</span>
                <span className="font-semibold text-slate-900">
                  {recentTraining ? new Date(recentTraining.date).toLocaleDateString("pl-PL") : "-"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Postep umiejetnosci</span>
                <span>{Math.round(overallSkillRatio * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                  style={{ width: `${Math.round(overallSkillRatio * 100)}%` }}
                />
              </div>
            </div>
            </div>
          </details>

          <details className="surface p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Top umiejetnosci</summary>
            <div className="mt-3 px-2 pb-2">
            <h2 className="section-title">Top umiejetnosci</h2>
            <div className="mt-3 grid gap-2">
              {skillProgress.slice(0, 6).map((skill) => (
                <div key={skill.id} className="surface-muted flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate">{skill.name}</span>
                  <span className="pill">{Math.round(skill.ratio * 100)}%</span>
                </div>
              ))}
            </div>
            </div>
          </details>

          {role === "admin" ? <PlayerAccountPanel playerId={String(playerProfile._id)} playerName={`${player.firstName} ${player.lastName}`} /> : null}
        </div>
      </div>
    </div>
  );
}
