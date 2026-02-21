import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { PlayerSkill } from "@/models/PlayerSkill";
import { requireRoleApi } from "@/lib/auth";
import { z } from "zod";

type SessionUser = { role?: "admin" | "trainer" | "viewer" | "player"; playerId?: string | null; id?: string };

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
  const user = (auth.session?.user as SessionUser | undefined) ?? undefined;
  const role = user?.role;
  const ownPlayerId = user?.playerId;

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
  const user = (auth.session?.user as SessionUser | undefined) ?? undefined;

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
    createdByUserId: user?.id ?? undefined,
  });

  if (created.skillId) {
    const mappedStatus =
      created.status === "done"
        ? "zrobione"
        : created.status === "in_progress"
          ? "w_trakcie"
          : "plan";

    await PlayerSkill.findOneAndUpdate(
      {
        playerId: created.playerId,
        skillId: created.skillId,
        detailId: created.detailId ?? null,
      },
      {
        $set: {
          status: mappedStatus,
          doneDate: created.status === "done" ? new Date() : null,
          notes: `Cel: ${created.title}`,
        },
      },
      { upsert: true, new: true }
    );
  }

  return NextResponse.json(created, { status: 201 });
}
