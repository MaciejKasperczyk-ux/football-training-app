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

type PageProps = { params: Promise<{ id: string }> };

type SkillAgg = {
  skillId: string;
  skillName: string;
  count: number;
  lastDate: Date;
  details: Record<string, { name: string; count: number; lastDate: Date }>;
};

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-semibold tracking-tight">Profil zawodnika</div>
        <div className="mt-2 text-sm text-gray-600">Brak dostępu</div>
        <Link className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  await dbConnect();

  const player = await Player.findById(id).populate("trainers").lean();
  if (!player) {
    return (
      <div className="space-y-3">
        <Link className="underline text-sm" href="/players">
          Wróć
        </Link>
        <div className="text-sm">Nie znaleziono zawodnika</div>
      </div>
    );
  }

  const trainings = await TrainingSession.find({ players: player._id }).sort({ date: -1 }).lean();
  const skills = await Skill.find().lean();
  const playerSkills = await PlayerSkill.find({ playerId: player._id }).lean();

  const playerSkillsMap = new Map<string, any>();
  for (const ps of playerSkills as any[]) {
    playerSkillsMap.set(String(ps.skillId), ps);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm text-gray-700 underline" href="/players">
              Wróć do listy
            </Link>

            <div className="mt-2 text-2xl font-semibold tracking-tight">
              {player.firstName} {player.lastName}
            </div>

            <div className="mt-2 grid gap-1 text-sm text-gray-600">
              <div>{player.club ? `Klub: ${player.club}` : "Klub: brak"}</div>
              <div>{player.position ? `Pozycja: ${player.position}` : "Pozycja: brak"}</div>
              <div>{player.birthDate ? `Wiek: ${Math.floor((Date.now() - new Date(player.birthDate).getTime()) / 1000 / 60 / 60 / 24 / 365)}` : (player.age ? `Wiek: ${player.age}` : "Wiek: brak")}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <DeletePlayerButton playerId={String(player._id)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <EditPlayerPanel player={player} playerId={String(player._id)} />
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
              <div className="text-lg font-semibold tracking-tight">Historia treningów</div>
              <div className="mt-1 text-sm text-gray-600">Wszystkie zarejestrowane treningi zawodnika</div>
            </div>

            {trainings.length === 0 ? (
              <div className="p-5 text-sm text-gray-600">Brak treningów</div>
            ) : (
              <div className="p-5 grid gap-3">
                {trainings.map((t: any) => (
                  <div key={String(t._id)} className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                    <div className="text-sm font-semibold">
                      {new Date(t.date).toLocaleDateString("pl-PL")}
                      {t.durationMinutes ? ` , ${t.durationMinutes} min` : ""}
                    </div>
                    {t.goal ? <div className="mt-1 text-sm text-gray-600">{t.goal}</div> : null}
                    {t.notes ? <div className="mt-2 text-sm text-gray-600">{t.notes}</div> : null}
                    <div className="mt-2 text-xs text-gray-600">Elementy: {t.entries?.length ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
              <div className="text-lg font-semibold tracking-tight">Szczegóły i podsumowanie umiejętności</div>
              <div className="mt-1 text-sm text-gray-600">Informacje zawodnika i lista głównych umiejętności</div>
            </div>

            <div className="p-5 grid gap-3">
              <div className="text-sm font-medium">Szczegóły zawodnika</div>
              <div className="text-sm text-gray-600">
                {player.club ? `Klub: ${player.club}` : "Klub: brak"}
                <br />
                {player.position ? `Pozycja: ${player.position}` : "Pozycja: brak"}
                <br />
                {player.birthDate ? `Wiek: ${Math.floor((Date.now() - new Date(player.birthDate).getTime()) / 1000 / 60 / 60 / 24 / 365)}` : (player.age ? `Wiek: ${player.age}` : "Wiek: brak")}
              </div>

              <div className="mt-3 text-sm font-medium">Główne umiejętności</div>
              <div className="grid gap-2">
                {(skills as any[]).map((s) => {
                  const ps = playerSkillsMap.get(String(s._id));
                  const status = ps ? ps.status : undefined;
                  return (
                    <div key={String(s._id)} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                      <div className="text-sm">{String(s.name)}</div>
                      <div className="text-xs text-gray-600">{status ? status : "nie opanowana"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
