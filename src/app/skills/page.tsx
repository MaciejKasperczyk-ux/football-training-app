import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

type SkillListItem = {
  _id: unknown;
  name: string;
  details?: unknown[];
};

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
  const skillsList = skills as SkillListItem[];
  const maxDetails = Math.max(1, ...skillsList.map((skill) => skill.details?.length ?? 0));
  const role = (session.user as { role?: string } | undefined)?.role;

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Umiejetnosci</h1>
        <p className="page-subtitle">Przegladaj i porzadkuj biblioteke umiejetnosci oraz podumiejetnosci.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Lista umiejetnosci i ich podumiejetnosci</div>

        {role === "admin" ? (
          <Link className="btn btn-primary" href="/admin/skills">
            Zarzadzaj umiejetnosciami
          </Link>
        ) : null}
      </div>

      <div className="surface p-3 md:p-4">
        <div className="entity-stats">
          <span className="pill">Umiejetnosci: {skillsList.length}</span>
          <span className="pill">Max podumiejetnosci: {maxDetails}</span>
        </div>

        {skillsList.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak umiejetnosci</div>
        ) : (
          <div className="entity-grid">
            {skillsList.map((skill) => {
              const detailCount = skill.details?.length ?? 0;
              const meter = Math.round((detailCount / maxDetails) * 100);

              return (
                <article key={String(skill._id)} className="entity-card">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="entity-title">{skill.name}</h2>
                    <span className="pill">{detailCount} podum.</span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                      <span>Zakres cwiczen</span>
                      <span>{meter}%</span>
                    </div>
                    <div className="entity-meter">
                      <span style={{ width: `${meter}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link className="btn btn-secondary" href={`/skills/${String(skill._id)}`}>
                      Otwórz
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
