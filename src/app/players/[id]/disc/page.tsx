import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import DiscSurveyForm from "@/components/players/DiscSurveyForm";

type Props = { params: Promise<{ id: string }> };

export default async function PlayerDiscPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="surface p-6">
        <div className="page-title">Ankieta DISC</div>
        <div className="mt-2 text-sm text-slate-600">Brak dostepu.</div>
      </div>
    );
  }

  await dbConnect();
  const player = await Player.findById(id).lean();
  if (!player) {
    return (
      <div className="surface p-6">
        <div className="page-title">Ankieta DISC</div>
        <div className="mt-2 text-sm text-slate-600">Nie znaleziono zawodnika.</div>
      </div>
    );
  }

  const user = session.user as { role?: string; id?: string; playerId?: string | null };
  const role = user.role;
  const isOwnPlayer = role === "player" && String(user.playerId ?? "") === String(id);
  const isManager = role === "admin" || role === "trainer";
  if (!isOwnPlayer && !isManager) {
    return (
      <div className="surface p-6">
        <div className="page-title">Ankieta DISC</div>
        <div className="mt-2 text-sm text-slate-600">Brak dostepu do tej ankiety.</div>
      </div>
    );
  }

  const discAssignedTo = ((player as any).discAssignedTo ?? "player") as "player" | "admin";
  const discStatus = ((player as any).discStatus ?? "pending") as "pending" | "completed";
  const readonlyMode = discStatus === "completed" && !isManager;
  const canFill =
    (discAssignedTo === "player" && isOwnPlayer) ||
    (discAssignedTo === "admin" && isManager) ||
    (discStatus === "completed" && isManager);

  if (!canFill) {
    return (
      <div className="surface p-6">
        <div className="page-title">Ankieta DISC</div>
        <div className="mt-2 text-sm text-slate-600">Ta ankieta jest przypisana do innej osoby.</div>
      </div>
    );
  }

  return (
    <div className="page-wrap max-w-5xl">
      <div className="hero-card">
        <h1 className="page-title">Ankieta DISC</h1>
        <p className="page-subtitle">
          {player.firstName} {player.lastName} | przypisanie: {discAssignedTo === "player" ? "zawodnik" : "trener/admin"}
        </p>
        <Link className="btn btn-secondary mt-3" href={`/players/${id}`}>
          Wroc do profilu
        </Link>
      </div>

      <DiscSurveyForm
        playerId={id}
        readonlyMode={readonlyMode}
        initialArea={(player as any).discArea ?? null}
        initialAnswers={(player as any).discAnswers ?? {}}
      />
    </div>
  );
}
