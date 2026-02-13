import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { requireRoleApi } from "@/lib/auth";
import { z } from "zod";

const goalCreateSchema = z.object({
  playerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().min(1),
  status: z.enum(["planned", "in_progress", "done"]).optional(),
  skillId: z.string().optional(),
  detailId: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  let playerId = searchParams.get("playerId");
  const status = searchParams.get("status");
  const role = (auth.session?.user as any)?.role;
  const ownPlayerId = (auth.session?.user as any)?.playerId;

  if (role === "player") {
    if (!ownPlayerId) return NextResponse.json([], { status: 200 });
    if (playerId && String(playerId) !== String(ownPlayerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    playerId = String(ownPlayerId);
  }

  const filter: Record<string, unknown> = {};
  if (playerId) filter.playerId = playerId;
  if (status) filter.status = status;

  const goals = await Goal.find(filter).sort({ dueDate: 1 });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = goalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await Goal.create({
    playerId: parsed.data.playerId,
    title: parsed.data.title,
    description: parsed.data.description,
    dueDate: new Date(parsed.data.dueDate),
    status: parsed.data.status ?? "planned",
    skillId: parsed.data.skillId,
    detailId: parsed.data.detailId,
    createdByUserId: (auth.session?.user as any)?.id ?? undefined,
  });

  return NextResponse.json(created, { status: 201 });
}
