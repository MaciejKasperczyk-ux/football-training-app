import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { requireRoleApi } from "@/lib/auth";
import { Types } from "mongoose";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

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

  const role = (auth.session?.user as any)?.role;
  const ownPlayerId = (auth.session?.user as any)?.playerId;
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
