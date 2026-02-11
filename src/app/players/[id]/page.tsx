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

type PageProps = { params: Promise<{ id: string }> };

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
  const playerSkillsMap = new Map<string, string>();
  for (const ps of playerSkills as any[]) {
    playerSkillsMap.set(String(ps.skillId), String(ps.status));
  }

  const age = ageFromBirthDate((player as any).birthDate) ?? (player as any).age ?? null;

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
            <DeletePlayerButton playerId={String(player._id)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <EditPlayerPanel player={player} playerId={String(player._id)} />
          <PlayerSkillsManager playerId={String(player._id)} />
          <PlayerGoals playerId={String(player._id)} />

          <div className="surface p-5">
            <div className="mb-3">
              <h2 className="section-title">Historia treningow</h2>
              <p className="section-copy">Wszystkie zarejestrowane treningi zawodnika.</p>
            </div>

            {trainings.length === 0 ? (
              <div className="text-sm text-slate-600">Brak treningow.</div>
            ) : (
              <div className="grid gap-2">
                {(trainings as any[]).map((training) => (
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
          <div className="surface p-5">
            <h2 className="section-title">Podsumowanie</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <div>Klub: <span className="font-medium">{(player as any).club || "-"}</span></div>
              <div>Pozycja: <span className="font-medium">{(player as any).position || "-"}</span></div>
              <div>Wiek: <span className="font-medium">{age ?? "-"}</span></div>
              <div>Lepsza noga: <span className="font-medium">{(player as any).dominantFoot || "-"}</span></div>
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="section-title">Glowne umiejetnosci</h2>
            <div className="mt-3 grid gap-2">
              {(skills as any[]).map((skill) => (
                <div key={String(skill._id)} className="surface-muted flex items-center justify-between px-3 py-2 text-sm">
                  <span>{String(skill.name)}</span>
                  <span className="pill">{playerSkillsMap.get(String(skill._id)) ?? "nie opanowana"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
