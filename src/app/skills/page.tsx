import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

type SubSkillListItem = {
  _id: unknown;
  name: string;
  difficulty?: 1 | 2 | 3;
};

type SkillListItem = {
  _id: unknown;
  name: string;
  details?: SubSkillListItem[];
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
          <span className="pill">
            Podumiejetnosci: {skillsList.reduce((acc, skill) => acc + (skill.details?.length ?? 0), 0)}
          </span>
        </div>

        {skillsList.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Brak umiejetnosci</div>
        ) : (
          <div className="entity-grid">
            {skillsList.map((skill) => {
              const detailCount = skill.details?.length ?? 0;
              const p1 = (skill.details ?? []).filter((detail) => (detail.difficulty ?? 1) === 1).length;
              const p2 = (skill.details ?? []).filter((detail) => detail.difficulty === 2).length;
              const p3 = (skill.details ?? []).filter((detail) => detail.difficulty === 3).length;
              const preview = (skill.details ?? []).slice(0, 3).map((detail) => detail.name);

              return (
                <article key={String(skill._id)} className="entity-card">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="entity-title">{skill.name}</h2>
                    <span className="pill">{detailCount} podum.</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                      P1: {p1}
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-semibold text-sky-800">
                      P2: {p2}
                    </span>
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-semibold text-orange-800">
                      P3: {p3}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    {preview.length > 0 ? `${preview.join(", ")}${detailCount > 3 ? "..." : ""}` : "Brak podumiejetnosci"}
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
