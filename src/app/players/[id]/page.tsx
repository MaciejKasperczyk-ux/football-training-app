import Image from "next/image";
import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { PlayerSkill } from "@/models/PlayerSkill";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { canAccessPlayer, type AppRole } from "@/lib/auth";
import DeletePlayerButton from "@/components/players/DeletePlayerButton";
import EditPlayerPanel from "@/components/players/EditPlayerPanel";
import PlayerSkillsManager from "@/components/players/PlayerSkillsManager";
import PlayerGoals from "@/components/players/PlayerGoals";
import PlayerSkillsRadar from "@/components/players/PlayerSkillsRadar";
import PlayerAccountPanel from "@/components/players/PlayerAccountPanel";

type PageProps = { params: Promise<{ id: string }> };
type SkillItem = { _id: unknown; name: string; details?: unknown[] };
type PlayerSkillItem = { skillId: unknown; detailId?: unknown | null; status?: string };
type SessionUser = { role?: AppRole; playerId?: string | null } & Record<string, unknown>;
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
  if (!canAccessPlayer(sessionUser, id)) {
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

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg sm:h-24 sm:w-24">
              {playerProfile.photo ? (
                <Image
                  src={playerProfile.photo}
                  alt={`Zdjecie ${player.firstName} ${player.lastName}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-300/40 to-blue-400/30 text-2xl font-bold text-white">
                  {playerInitials}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
                  PLAYER PROFILE
                </span>
                {playerProfile.position ? <span className="pill border-white/20 bg-white/10 text-slate-100">{playerProfile.position}</span> : null}
                {playerProfile.club ? <span className="pill border-white/20 bg-white/10 text-slate-100">{playerProfile.club}</span> : null}
              </div>
              <h1 className="page-title">{player.firstName} {player.lastName}</h1>
              <p className="page-subtitle">Profil zawodnika, historia treningow i plan rozwoju.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Wiek: {age ?? "-"}</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Lepsza noga: {dominantFoot}</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  Ostatni trening: {recentTraining ? new Date(recentTraining.date).toLocaleDateString("pl-PL") : "Brak"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid min-w-[220px] gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <div className="text-[11px] uppercase tracking-wide text-cyan-100/80">Treningi</div>
                <div className="mt-1 text-xl font-semibold text-white">{trainingsList.length}</div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <div className="text-[11px] uppercase tracking-wide text-cyan-100/80">Zakonczone treningi</div>
                <div className="mt-1 text-xl font-semibold text-white">{completedTrainings}</div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <div className="text-[11px] uppercase tracking-wide text-cyan-100/80">Umiejetnosci</div>
                <div className="mt-1 text-xl font-semibold text-white">{Math.round(overallSkillRatio * 100)}%</div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <div className="text-[11px] uppercase tracking-wide text-cyan-100/80">Zakonczone umiejetnosci</div>
                <div className="mt-1 text-xl font-semibold text-white">{completedSkills}/{skillProgress.length}</div>
              </div>
            </div>

            {canManage ? (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Link className="btn btn-secondary" href="/players">
                  Wroc do listy
                </Link>
                <DeletePlayerButton playerId={String(playerProfile._id)} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {canManage ? <EditPlayerPanel player={playerProfile} playerId={String(playerProfile._id)} /> : null}
          <PlayerSkillsManager playerId={String(playerProfile._id)} canManage={canManage} />
          <PlayerGoals playerId={String(playerProfile._id)} canManage={canManage} />

          <div className="surface p-5">
            <div className="mb-3">
              <h2 className="section-title">Historia treningow</h2>
              <p className="section-copy">Wszystkie zarejestrowane treningi zawodnika.</p>
            </div>

            {trainings.length === 0 ? (
              <div className="text-sm text-slate-600">Brak treningow.</div>
            ) : (
              <div className="grid gap-2">
                {(trainings as TrainingItem[]).map((training) => (
                  <div key={String(training._id)} className="surface-muted p-3">
                    <div className="text-sm font-semibold">
                      {new Date(training.date).toLocaleDateString("pl-PL")}
                      {training.durationMinutes ? ` - ${training.durationMinutes} min` : ""}
                    </div>
                    {training.goal ? <div className="mt-1 text-sm text-slate-600">{training.goal}</div> : null}
                    {training.notes ? <div className="mt-1 text-xs text-slate-600">{training.notes}</div> : null}
                    <div className="mt-2"><span className="pill">Elementy: {training.entries?.length ?? 0}</span></div>
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
        </div>

        <div className="space-y-4">
          <PlayerSkillsRadar data={skillProgress} />
          {role === "admin" ? <PlayerAccountPanel playerId={String(playerProfile._id)} playerName={`${player.firstName} ${player.lastName}`} /> : null}

          <div className="surface p-5">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {playerProfile.photo ? (
                    <Image
                      src={playerProfile.photo}
                      alt={`Avatar ${player.firstName} ${player.lastName}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-200 to-blue-200 text-sm font-bold text-slate-700">
                      {playerInitials}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="section-title">Karta zawodnika</h2>
                  <p className="section-copy">Szybki podglad danych i postepu.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <div className="surface-muted flex items-center justify-between px-3 py-2">
                  <span className="text-slate-600">Klub</span>
                  <span className="font-semibold text-slate-900">{playerProfile.club || "-"}</span>
                </div>
                <div className="surface-muted flex items-center justify-between px-3 py-2">
                  <span className="text-slate-600">Pozycja</span>
                  <span className="font-semibold text-slate-900">{playerProfile.position || "-"}</span>
                </div>
                <div className="surface-muted flex items-center justify-between px-3 py-2">
                  <span className="text-slate-600">Wiek</span>
                  <span className="font-semibold text-slate-900">{age ?? "-"}</span>
                </div>
                <div className="surface-muted flex items-center justify-between px-3 py-2">
                  <span className="text-slate-600">Lepsza noga</span>
                  <span className="font-semibold text-slate-900">{dominantFoot}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Sredni postep umiejetnosci</span>
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
          </div>

          <div className="surface p-5">
            <h2 className="section-title">Glowne umiejetnosci</h2>
            <div className="mt-3 grid gap-2">
              {skillProgress.map((skill) => (
                <div key={skill.id} className="surface-muted flex items-center justify-between px-3 py-2 text-sm">
                  <span>{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="pill">{skill.done}/{skill.total}</span>
                    <span className="pill">{Math.round(skill.ratio * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
