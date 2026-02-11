import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import DeletePlayerButton from "@/components/players/DeletePlayerButton";

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

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Zawodnicy</h1>
        <p className="page-subtitle">Baza zawodnikow, profile i szybkie przejscie do planu rozwoju.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Baza zawodnikow i ich profile treningowe</div>
        <Link className="btn btn-primary" href="/players/new">
          Dodaj zawodnika
        </Link>
      </div>

      <div className="table-wrap">
        <div className="table-head grid grid-cols-12 gap-2 p-3 text-sm font-semibold text-slate-700">
          <div className="col-span-4">Imię i nazwisko</div>
          <div className="col-span-3">Klub</div>
          <div className="col-span-2">Pozycja</div>
          <div className="col-span-1">Wiek</div>
          <div className="col-span-2 text-right">Akcje</div>
        </div>

        {players.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak zawodnikow</div>
        ) : (
          players.map((p: any) => (
            <div key={String(p._id)} className="table-row grid grid-cols-12 gap-2 p-3 text-sm items-center">
              <div className="col-span-4 font-medium">
                <Link className="text-slate-900 hover:text-sky-700" href={`/players/${String(p._id)}`}>
                  {p.firstName} {p.lastName}
                </Link>
              </div>
              <div className="col-span-3 text-slate-600">{p.club ?? "-"}</div>
              <div className="col-span-2 text-slate-600">{p.position ?? "-"}</div>
              <div className="col-span-1 text-slate-600">{p.age ?? "-"}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Link className="btn btn-secondary" href={`/players/${String(p._id)}`}>
                  Otwórz
                </Link>
                <DeletePlayerButton playerId={String(p._id)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
