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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Zawodnicy</h1>
          <div className="text-sm text-gray-700 mt-1">Baza zawodników i ich profile treningowe</div>
        </div>

        <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/players/new">
          Dodaj zawodnika
        </Link>
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b p-3 text-sm font-medium bg-gray-50">
          <div className="col-span-4">Imię i nazwisko</div>
          <div className="col-span-3">Klub</div>
          <div className="col-span-2">Pozycja</div>
          <div className="col-span-1">Wiek</div>
          <div className="col-span-2 text-right">Akcje</div>
        </div>

        {players.length === 0 ? (
          <div className="p-3 text-sm">Brak zawodników</div>
        ) : (
          players.map((p: any) => (
            <div key={String(p._id)} className="grid grid-cols-12 gap-2 border-b p-3 text-sm items-center">
              <div className="col-span-4 font-medium">
                <Link className="underline" href={`/players/${String(p._id)}`}>
                  {p.firstName} {p.lastName}
                </Link>
              </div>
              <div className="col-span-3">{p.club ?? ""}</div>
              <div className="col-span-2">{p.position ?? ""}</div>
              <div className="col-span-1">{p.age ?? ""}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Link className="rounded border px-3 py-2 text-sm hover:bg-gray-50" href={`/players/${String(p._id)}`}>
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
