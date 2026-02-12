import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { PlayerSkill } from "@/models/PlayerSkill";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import DeletePlayerButton from "@/components/players/DeletePlayerButton";
import EditPlayerPanel from "@/components/players/EditPlayerPanel";
import PlayerSkillsManager from "@/components/players/PlayerSkillsManager";
import PlayerGoals from "@/components/players/PlayerGoals";
import PlayerSkillsRadar from "@/components/players/PlayerSkillsRadar";

type PageProps = { params: Promise<{ id: string }> };
type SkillItem = { _id: unknown; name: string; details?: unknown[] };
type PlayerSkillItem = { skillId: unknown; detailId?: unknown | null; status?: string };
type PlayerProfile = {
  _id: unknown;
  firstName: string;
  lastName: string;
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

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">{player.firstName} {player.lastName}</h1>
            <p className="page-subtitle">Profil zawodnika, historia treningow i plan rozwoju.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link className="btn btn-secondary" href="/players">
              Wroc do listy
            </Link>
            <DeletePlayerButton playerId={String(playerProfile._id)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <EditPlayerPanel player={playerProfile} playerId={String(playerProfile._id)} />
          <PlayerSkillsManager playerId={String(playerProfile._id)} />
          <PlayerGoals playerId={String(playerProfile._id)} />

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
                  <Link key={String(training._id)} href={`/trainings/${String(training._id)}`} className="surface-muted p-3">
                    <div className="text-sm font-semibold">
                      {new Date(training.date).toLocaleDateString("pl-PL")}
                      {training.durationMinutes ? ` - ${training.durationMinutes} min` : ""}
                    </div>
                    {training.goal ? <div className="mt-1 text-sm text-slate-600">{training.goal}</div> : null}
                    {training.notes ? <div className="mt-1 text-xs text-slate-600">{training.notes}</div> : null}
                    <div className="mt-2"><span className="pill">Elementy: {training.entries?.length ?? 0}</span></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <PlayerSkillsRadar data={skillProgress} />

          <div className="surface p-5">
            <h2 className="section-title">Podsumowanie</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <div>Klub: <span className="font-medium">{playerProfile.club || "-"}</span></div>
              <div>Pozycja: <span className="font-medium">{playerProfile.position || "-"}</span></div>
              <div>Wiek: <span className="font-medium">{age ?? "-"}</span></div>
              <div>Lepsza noga: <span className="font-medium">{playerProfile.dominantFoot || "-"}</span></div>
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
