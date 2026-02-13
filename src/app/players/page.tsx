import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import DeletePlayerButton from "@/components/players/DeletePlayerButton";

type PlayerListItem = {
  _id: unknown;
  firstName?: string;
  lastName?: string;
  club?: string | null;
  position?: string | null;
  age?: number | null;
};

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
  const players = await Player.find().sort({ lastName: 1, firstName: 1 }).lean();
  const playersList = players as PlayerListItem[];
  const clubCount = new Set(playersList.map((player) => String(player.club ?? "").trim()).filter(Boolean)).size;
  const knownAges = playersList.map((player) => player.age).filter((age) => typeof age === "number") as number[];
  const avgAge = knownAges.length ? Math.round(knownAges.reduce((sum, age) => sum + age, 0) / knownAges.length) : null;

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Zawodnicy</h1>
        <p className="page-subtitle">Baza zawodnikow, profile i szybkie przejscie do planu rozwoju.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Baza zawodnikow i ich profile treningowe</div>
        <Link className="btn btn-primary" href="/players/new">
          Dodaj zawodnika
        </Link>
      </div>

      <div className="surface p-3 md:p-4">
        <div className="entity-stats">
          <span className="pill">Zawodnicy: {playersList.length}</span>
          <span className="pill">Kluby: {clubCount}</span>
          <span className="pill">Sredni wiek: {avgAge ?? "-"}</span>
        </div>

        {playersList.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak zawodnikow</div>
        ) : (
          <div className="entity-grid">
            {playersList.map((player) => (
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
                    <div className="entity-value">{player.age ?? "-"}</div>
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

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Link className="btn btn-secondary" href={`/players/${String(player._id)}`}>
                    Otwórz
                  </Link>
                  <DeletePlayerButton playerId={String(player._id)} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
