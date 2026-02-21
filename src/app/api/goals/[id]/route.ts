import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { PlayerSkill } from "@/models/PlayerSkill";
import { requireRoleApi } from "@/lib/auth";
import { Types } from "mongoose";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };
type SessionUser = { role?: "admin" | "trainer" | "viewer" | "player"; playerId?: string | null };

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["planned", "in_progress", "done"]).optional(),
});

export async function GET(_: NextRequest, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid goal id" }, { status: 400 });

  await dbConnect();
  const goal = await Goal.findById(id);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = (auth.session?.user as SessionUser | undefined) ?? undefined;
  const role = user?.role;
  const ownPlayerId = user?.playerId;
  if (role === "player" && String(goal.playerId) !== String(ownPlayerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid goal id" }, { status: 400 });

  await dbConnect();
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.dueDate !== undefined) update.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const goal = await Goal.findByIdAndUpdate(id, update, { new: true });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Keep player's sub-skill progress in sync with goal status.
  if (parsed.data.status && goal.skillId) {
    const mappedStatus =
      parsed.data.status === "done"
        ? "zrobione"
        : parsed.data.status === "in_progress"
          ? "w_trakcie"
          : "plan";

    await PlayerSkill.findOneAndUpdate(
      {
        playerId: goal.playerId,
        skillId: goal.skillId,
        detailId: goal.detailId ?? null,
      },
      {
        $set: {
          status: mappedStatus,
          doneDate: parsed.data.status === "done" ? new Date() : null,
          notes: `Aktualizacja z celu: ${goal.title}`,
        },
      },
      { upsert: true, new: true }
    );
  }

  return NextResponse.json(goal);
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid goal id" }, { status: 400 });

  await dbConnect();
  const deleted = await Goal.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
