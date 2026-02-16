import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import DeletePlayerButton from "@/components/players/DeletePlayerButton";
import { redirect } from "next/navigation";
import { ageToGroup } from "@/lib/ageGroups";

type TrainerRef = {
  _id?: unknown;
  name?: string;
  email?: string;
};

type PlayerListItem = {
  _id: unknown;
  firstName?: string;
  lastName?: string;
  club?: string | null;
  position?: string | null;
  age?: number | null;
  birthDate?: Date | string | null;
  trainers?: Array<TrainerRef | string>;
};

function calculateAgeFromBirthDate(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function trainerDisplayName(value: TrainerRef | string): string {
  if (typeof value === "string") return value;
  return value.name?.trim() || value.email?.trim() || String(value._id ?? "");
}

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Zawodnicy</h1>
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

  if (role === "player" && ownPlayerId) {
    redirect(`/players/${ownPlayerId}`);
  }
  if (role === "player" && !ownPlayerId) {
    return (
      <div className="surface p-6">
        <h1 className="page-title">Zawodnicy</h1>
        <div className="mt-2 text-sm text-slate-600">Konto zawodnika nie jest jeszcze przypisane do profilu.</div>
      </div>
    );
  }

  const players = await Player.find()
    .populate("trainers", "name email")
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  const playersList = players as PlayerListItem[];
  const playersWithMeta = playersList.map((player) => {
    const effectiveAge = typeof player.age === "number" ? player.age : calculateAgeFromBirthDate(player.birthDate);
    const group = ageToGroup(effectiveAge);
    const trainerNames = (player.trainers ?? []).map(trainerDisplayName).filter(Boolean);
    return { ...player, effectiveAge, group, trainerNames };
  });

  const clubCount = new Set(playersList.map((player) => String(player.club ?? "").trim()).filter(Boolean)).size;
  const knownAges = playersWithMeta
    .map((player) => player.effectiveAge)
    .filter((age): age is number => typeof age === "number");
  const avgAge = knownAges.length ? Math.round(knownAges.reduce((sum, age) => sum + age, 0) / knownAges.length) : null;
  const groupedPlayers = new Map<string, typeof playersWithMeta>();

  for (const player of playersWithMeta) {
    const key = player.group ?? "Bez kategorii";
    const groupValues = groupedPlayers.get(key) ?? [];
    groupValues.push(player);
    groupedPlayers.set(key, groupValues);
  }

  const sortedGroups = Array.from(groupedPlayers.entries()).sort(([a], [b]) => {
    if (a === "Bez kategorii") return 1;
    if (b === "Bez kategorii") return -1;
    return Number(a.replace("U", "")) - Number(b.replace("U", ""));
  });

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Zawodnicy</h1>
        <p className="page-subtitle">Baza zawodników, profile i szybkie przejście do planu rozwoju.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Baza zawodników i ich profile treningowe</div>
        {role === "admin" || role === "trainer" ? (
          <Link className="btn btn-primary" href="/players/new">
            Dodaj zawodnika
          </Link>
        ) : null}
      </div>

      <div className="surface p-3 md:p-4">
        <div className="entity-stats">
          <span className="pill">Zawodnicy: {playersList.length}</span>
          <span className="pill">Kluby: {clubCount}</span>
          <span className="pill">Średni wiek: {avgAge ?? "-"}</span>
          <span className="pill">Grupy U: {sortedGroups.filter(([group]) => group !== "Bez kategorii").length}</span>
        </div>

        {playersList.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak zawodników</div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map(([group, groupPlayers]) => (
              <section key={group} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="section-title">{group}</h2>
                  <span className="pill">Zawodnicy: {groupPlayers.length}</span>
                </div>

                <div className="entity-grid">
                  {groupPlayers.map((player) => (
                    <article key={String(player._id)} className="entity-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link className="entity-title" href={`/players/${String(player._id)}`}>
                            {player.firstName} {player.lastName}
                          </Link>
                          <p className="entity-subtle">{player.club ?? "Brak klubu"}</p>
                        </div>
                        <span className="pill">{player.position ?? "Brak pozycji"}</span>
                      </div>

                      <div className="entity-metrics mt-4">
                        <div>
                          <div className="entity-label">Wiek</div>
                          <div className="entity-value">{player.effectiveAge ?? "-"}</div>
                        </div>
                        <div>
                          <div className="entity-label">Pozycja</div>
                          <div className="entity-value">{player.position ?? "-"}</div>
                        </div>
                        <div>
                          <div className="entity-label">Klub</div>
                          <div className="entity-value truncate">{player.club ?? "-"}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="entity-label">Trenerzy</div>
                        <div className="mt-1 text-sm text-slate-700">{player.trainerNames.length ? player.trainerNames.join(", ") : "Brak przypisania"}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Link className="btn btn-secondary" href={`/players/${String(player._id)}`}>
                          Otwórz
                        </Link>
                        {role === "admin" || role === "trainer" ? <DeletePlayerButton playerId={String(player._id)} /> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
