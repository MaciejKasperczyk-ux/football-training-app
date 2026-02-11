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
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Umiejetnosci</h1>
        <p className="page-subtitle">Przegladaj i porzadkuj biblioteke umiejetnosci oraz podumiejetnosci.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Lista umiejetnosci i ich podumiejetnosci</div>

        {session?.user && (session.user as any).role === "admin" ? (
          <Link className="btn btn-primary" href="/admin/skills">
            Zarzadzaj umiejetnosciami
          </Link>
        ) : null}
      </div>

      <div className="table-wrap">
        <div className="table-head grid grid-cols-12 gap-2 p-3 text-sm font-semibold text-slate-700">
          <div className="col-span-6">Nazwa</div>
          <div className="col-span-4">Liczba podumiejetnosci</div>
          <div className="col-span-2 text-right">Akcje</div>
        </div>

        {skills.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak umiejetnosci</div>
        ) : (
          (skills as any[]).map((s) => (
            <div key={String(s._id)} className="table-row grid grid-cols-12 gap-2 p-3 text-sm items-center">
              <div className="col-span-6 font-medium">{s.name}</div>
              <div className="col-span-4"><span className="pill">{s.details?.length ?? 0}</span></div>
              <div className="col-span-2 text-right">
                <Link className="btn btn-secondary" href={`/skills/${String(s._id)}`}>
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
