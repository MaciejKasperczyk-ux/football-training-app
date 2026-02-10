import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function SkillsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Umiejętności</h1>
        <div className="text-sm">Brak dostępu</div>
        <Link className="underline text-sm" href="/login">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  await dbConnect();
  const skills = await Skill.find().populate("details").sort({ name: 1 }).lean();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Umiejętności</h1>
          <div className="text-sm text-gray-700 mt-1">Lista umiejętności i ich detali</div>
        </div>

        {session?.user && (session.user as any).role === "admin" ? (
          <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/admin/skills">
            Zarządzaj umiejętnościami
          </Link>
        ) : null}
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b p-3 text-sm font-medium bg-gray-50">
          <div className="col-span-6">Nazwa</div>
          <div className="col-span-4">Liczba detali</div>
          <div className="col-span-2 text-right">Akcje</div>
        </div>

        {skills.length === 0 ? (
          <div className="p-3 text-sm">Brak umiejętności</div>
        ) : (
          (skills as any[]).map((s) => (
            <div key={String(s._id)} className="grid grid-cols-12 gap-2 border-b p-3 text-sm items-center">
              <div className="col-span-6 font-medium">{s.name}</div>
              <div className="col-span-4">{s.details?.length ?? 0}</div>
              <div className="col-span-2 text-right">
                <Link className="rounded border px-3 py-2 text-sm hover:bg-gray-50" href={`/skills/${String(s._id)}`}>
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
