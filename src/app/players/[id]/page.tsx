import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
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

  const trainings = await TrainingSession.find({ playerId: player._id }).sort({ date: -1 }).lean();
  const skills = await Skill.find().lean();

  const skillsMap = new Map<string, any>();
  for (const s of skills as any[]) {
    skillsMap.set(String(s._id), s);
  }

  const aggMap = new Map<string, SkillAgg>();

  for (const t of trainings as any[]) {
    const tDate = new Date(t.date);

    for (const e of (t.entries ?? []) as any[]) {
      const sid = String(e.skillId);
      const skill = skillsMap.get(sid);
      if (!skill) continue;

      let agg = aggMap.get(sid);
      if (!agg) {
        agg = {
          skillId: sid,
          skillName: String(skill.name),
          count: 0,
          lastDate: tDate,
          details: {},
        };
        aggMap.set(sid, agg);
      }

      agg.count += 1;
      if (tDate > agg.lastDate) agg.lastDate = tDate;

      if (e.detailId) {
        const did = String(e.detailId);
        const detail = (skill.details ?? []).find((d: any) => String(d._id) === did);
        const dName = detail ? String(detail.name) : "Podumiejętność";

        const existing = agg.details[did];
        if (!existing) {
          agg.details[did] = { name: dName, count: 1, lastDate: tDate };
        } else {
          existing.count += 1;
          if (tDate > existing.lastDate) existing.lastDate = tDate;
        }
      }
    }
  }

  const workedSkills = Array.from(aggMap.values()).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());

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
              <div className="text-lg font-semibold tracking-tight">Podsumowanie umiejętności</div>
              <div className="mt-1 text-sm text-gray-600">Ostatnie realizacje z treningów</div>
            </div>

            {workedSkills.length === 0 ? (
              <div className="p-5 text-sm text-gray-600">Brak danych</div>
            ) : (
              <div className="p-5 grid gap-3">
                {workedSkills.slice(0, 8).map((s) => (
                  <div key={s.skillId} className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                    <div className="text-sm font-semibold">{s.skillName}</div>
                    <div className="mt-1 text-xs text-gray-600">
                      Ostatnio: {s.lastDate.toLocaleDateString("pl-PL")} , wpisów: {s.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
