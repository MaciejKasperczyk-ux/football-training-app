import Link from "next/link";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { dbConnect } from "@/lib/mongodb";
import { Skill } from "@/models/Skill";

type PageProps = { params: Promise<{ id: string }> };

type SubSkillItem = {
  _id: unknown;
  name: string;
  description?: string | null;
};

type SkillItem = {
  _id: unknown;
  name: string;
  category?: string | null;
  details?: SubSkillItem[];
};

export default async function SkillDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="surface p-6">
        <div className="page-title">Szczegoly umiejetnosci</div>
        <div className="mt-2 text-sm text-slate-600">Brak dostepu</div>
        <Link className="btn btn-primary mt-4" href="/login">
          Przejdz do logowania
        </Link>
      </div>
    );
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return (
      <div className="page-wrap">
        <Link className="btn btn-secondary w-fit" href="/skills">
          Wroc do listy
        </Link>
        <div className="surface p-5 text-sm text-slate-700">Niepoprawne ID umiejetnosci.</div>
      </div>
    );
  }

  await dbConnect();
  const doc = await Skill.findById(id).populate("details").lean();

  if (!doc) {
    return (
      <div className="page-wrap">
        <Link className="btn btn-secondary w-fit" href="/skills">
          Wroc do listy
        </Link>
        <div className="surface p-5 text-sm text-slate-700">Nie znaleziono umiejetnosci.</div>
      </div>
    );
  }

  const skill = doc as SkillItem;
  const details = skill.details ?? [];
  const role = (session.user as { role?: string } | undefined)?.role;

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">{skill.name}</h1>
            <p className="page-subtitle">Szczegoly umiejetnosci i lista podumiejetnosci.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link className="btn btn-secondary" href="/skills">
              Wroc do listy
            </Link>
            {role === "admin" ? (
              <Link className="btn btn-primary" href="/admin/skills">
                Zarzadzaj
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <div className="entity-stats">
          <span className="pill">Podumiejetnosci: {details.length}</span>
          <span className="pill">Kategoria: {skill.category || "-"}</span>
        </div>

        {details.length === 0 ? (
          <div className="text-sm text-slate-600">Ta umiejetnosc nie ma jeszcze podumiejetnosci.</div>
        ) : (
          <div className="grid gap-2">
            {details.map((detail) => (
              <div key={String(detail._id)} className="surface-muted p-3">
                <div className="text-sm font-semibold text-slate-800">{detail.name}</div>
                {detail.description ? <div className="mt-1 text-sm text-slate-600">{detail.description}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
