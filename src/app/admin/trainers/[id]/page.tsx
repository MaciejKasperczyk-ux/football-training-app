import Link from "next/link";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Player } from "@/models/Player";
import { normalizeAgeGroup, type AgeGroup } from "@/lib/ageGroups";

type TrainerDoc = {
  _id: unknown;
  name?: string;
  email?: string;
  phone?: string;
  club?: string;
  yearGroup?: string;
  yearGroups?: string[];
};

type PlayerDoc = {
  _id: unknown;
  firstName?: string;
  lastName?: string;
  club?: string;
  position?: string;
};

export default async function TrainerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user) redirect("/login");
  if (role !== "admin" && role !== "trainer" && role !== "viewer") redirect("/");

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return (
      <div className="page-wrap">
        <div className="surface p-6">
          <h1 className="page-title">Profil trenera</h1>
          <p className="mt-2 text-sm text-slate-600">NieprawidĹ‚owe ID trenera.</p>
          <Link className="btn btn-secondary mt-4" href="/admin/trainers">
            WrĂłÄ‡ do listy trenerĂłw
          </Link>
        </div>
      </div>
    );
  }

  await dbConnect();

  const trainer = (await User.findOne({ _id: id, role: "trainer" })
    .select("name email phone club yearGroups yearGroup")
    .lean()) as TrainerDoc | null;

  if (!trainer) {
    return (
      <div className="page-wrap">
        <div className="surface p-6">
          <h1 className="page-title">Profil trenera</h1>
          <p className="mt-2 text-sm text-slate-600">Nie znaleziono trenera.</p>
          <Link className="btn btn-secondary mt-4" href="/admin/trainers">
            WrĂłÄ‡ do listy trenerĂłw
          </Link>
        </div>
      </div>
    );
  }

  const players = (await Player.find({ trainers: id })
    .select("firstName lastName club position")
    .sort({ lastName: 1, firstName: 1 })
    .lean()) as PlayerDoc[];

  const groupsRaw = Array.isArray(trainer.yearGroups) && trainer.yearGroups.length ? trainer.yearGroups : trainer.yearGroup ? [trainer.yearGroup] : [];
  const groups = groupsRaw
    .map((value) => normalizeAgeGroup(String(value)))
    .filter((value): value is AgeGroup => value !== null);

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Profil trenera</h1>
        <p className="page-subtitle">{trainer.name ?? "Bez nazwy"}</p>
      </div>

      <div className="surface p-5">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <div className="entity-label">E-mail</div>
            <a className="entity-value hover:underline" href={`mailto:${trainer.email ?? ""}`}>
              {trainer.email ?? "-"}
            </a>
          </div>
          <div>
            <div className="entity-label">Telefon</div>
            <a className="entity-value hover:underline" href={`tel:${String(trainer.phone ?? "").replace(/\s+/g, "")}`}>
              {trainer.phone ?? "-"}
            </a>
          </div>
          <div>
            <div className="entity-label">Klub</div>
            <div className="entity-value">{trainer.club ?? "-"}</div>
          </div>
          <div>
            <div className="entity-label">Grupy U</div>
            <div className="entity-value">{groups.length ? groups.join(", ") : "-"}</div>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Przypisani zawodnicy</h2>
          <span className="pill">{players.length}</span>
        </div>

        {players.length === 0 ? (
          <div className="mt-3 text-sm text-slate-600">Brak zawodnikĂłw przypisanych bezpoĹ›rednio do tego trenera.</div>
        ) : (
          <div className="mt-4 entity-grid">
            {players.map((player) => (
              <article key={String(player._id)} className="entity-card">
                <Link className="entity-title" href={`/players/${String(player._id)}`}>
                  {player.firstName} {player.lastName}
                </Link>
                <div className="entity-subtle mt-1">{player.club ?? "Brak klubu"}</div>
                <div className="mt-2 text-sm text-slate-600">Pozycja: {player.position ?? "-"}</div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link className="btn btn-secondary" href="/admin/trainers">
            WrĂłÄ‡ do listy trenerĂłw
          </Link>
        </div>
      </div>
    </div>
  );
}
