import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { requireRoleApi } from "@/lib/auth";
import { DISC_POINTS, DISC_QUESTION_GROUPS, scoreDiscAnswers, type DiscArea, type DiscAssignedTo } from "@/lib/disc";

type Ctx = { params: Promise<{ id: string }> };

function normalizeAnswers(value: unknown) {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const out: Record<string, number> = {};
  for (const group of DISC_QUESTION_GROUPS) {
    for (const statement of group.statements) {
      out[statement.id] = Number(source[statement.id] ?? 0);
    }
  }
  return out;
}

function validateGroupPoints(answers: Record<string, number>) {
  for (const group of DISC_QUESTION_GROUPS) {
    const values = group.statements.map((statement) => answers[statement.id]);
    const sorted = [...values].sort((a, b) => b - a);
    if (JSON.stringify(sorted) !== JSON.stringify([...DISC_POINTS])) return false;
  }
  return true;
}

export async function GET(_: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  await dbConnect();
  const player = await Player.findById(id).lean();
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = (auth.session?.user as { role?: string; id?: string; playerId?: string | null } | undefined) ?? undefined;
  const role = user?.role;
  if (role === "player" && String(user?.playerId ?? "") !== String(id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "club_trainer") {
    const ownId = String(user?.id ?? "");
    const assigned = ((player as { trainers?: unknown[] }).trainers ?? []).some((trainerId) => String(trainerId) === ownId);
    if (!assigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    discAssignedTo: (player as any).discAssignedTo ?? "player",
    discStatus: (player as any).discStatus ?? "pending",
    discArea: (player as any).discArea ?? null,
    discScores: (player as any).discScores ?? { D: 0, I: 0, S: 0, C: 0 },
    discAnswers: (player as any).discAnswers ?? {},
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  await dbConnect();
  const player = await Player.findById(id);
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = (auth.session?.user as { role?: string; id?: string; playerId?: string | null } | undefined) ?? undefined;
  const role = user?.role;
  const assignedTo = ((player as any).discAssignedTo ?? "player") as DiscAssignedTo;

  if (assignedTo === "player") {
    if (role !== "player" || String(user?.playerId ?? "") !== String(id)) {
      return NextResponse.json({ error: "Only player can submit this survey" }, { status: 403 });
    }
  } else if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Only trainer/admin can submit this survey" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const area = body?.area === "family" ? "family" : "sport";
  const answers = normalizeAnswers(body?.answers);
  if (!validateGroupPoints(answers)) {
    return NextResponse.json({ error: "W kazdej grupie punkty musza byc unikalne: 4,3,2,1." }, { status: 400 });
  }

  const scores = scoreDiscAnswers(answers);
  (player as any).discArea = area as DiscArea;
  (player as any).discAnswers = answers;
  (player as any).discScores = scores;
  (player as any).discStatus = "completed";
  (player as any).discCompletedAt = new Date();
  await player.save();

  return NextResponse.json({ ok: true, scores });
}
