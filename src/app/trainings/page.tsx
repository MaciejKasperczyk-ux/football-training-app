import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { Player } from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function TrainingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Treningi</h1>
        <div className="text-sm">Brak dostępu</div>
        <Link className="underline text-sm" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  await dbConnect();

  const trainings = await TrainingSession.find().sort({ date: -1 }).lean();
  const players = await Player.find().lean();

  const playersMap = new Map<string, string>();
  for (const p of players as any[]) {
    playersMap.set(String(p._id), `${p.firstName} ${p.lastName}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Treningi</h1>
          <div className="text-sm text-gray-700 mt-1">Zestawienie wszystkich zarejestrowanych treningów</div>
        </div>

        <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/trainings/new">
          Dodaj trening
        </Link>
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b p-3 text-sm font-medium bg-gray-50">
          <div className="col-span-3">Data</div>
          <div className="col-span-4">Zawodnik</div>
          <div className="col-span-2">Czas (min)</div>
          <div className="col-span-3">Elementy</div>
        </div>

        {trainings.length === 0 ? (
          <div className="p-3 text-sm">Brak treningów</div>
        ) : (
          (trainings as any[]).map((t) => (
            <a key={String(t._id)} href={`/trainings/${String(t._id)}`} className="grid grid-cols-12 gap-2 border-b p-3 text-sm hover:bg-gray-50">
              <div className="col-span-3">{new Date(t.date).toLocaleDateString("pl-PL")}</div>
              <div className="col-span-4">
                {((t.players ?? []) as string[])
                  .map((pid) => playersMap.get(String(pid)) ?? "Nieznany")
                  .join(", ")}
              </div>
              <div className="col-span-2">{t.durationMinutes ?? ""}</div>
              <div className="col-span-3">{t.entries?.length ?? 0}</div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
