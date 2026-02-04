import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Test } from "@/models/Test";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function TestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Testy</h1>
        <div className="text-sm">Brak dostępu</div>
        <Link className="underline text-sm" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  await dbConnect();
  const tests = await Test.find().sort({ name: 1 }).lean();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Testy</h1>
          <div className="text-sm text-gray-700 mt-1">Baza testów i pomiarów</div>
        </div>

        <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/tests/new">
          Dodaj test
        </Link>
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b p-3 text-sm font-medium bg-gray-50">
          <div className="col-span-7">Nazwa</div>
          <div className="col-span-3">Jednostka</div>
          <div className="col-span-2 text-right">Akcje</div>
        </div>

        {tests.length === 0 ? (
          <div className="p-3 text-sm">Brak testów</div>
        ) : (
          (tests as any[]).map((t) => (
            <div key={String(t._id)} className="grid grid-cols-12 gap-2 border-b p-3 text-sm items-center">
              <div className="col-span-7 font-medium">{t.name}</div>
              <div className="col-span-3">{t.unit ?? ""}</div>
              <div className="col-span-2 text-right">
                <Link className="rounded border px-3 py-2 text-sm hover:bg-gray-50" href={`/tests/${String(t._id)}`}>
                  Otwórz
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
