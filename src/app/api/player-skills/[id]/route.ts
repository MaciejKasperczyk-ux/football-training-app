import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { requireRoleApi } from "@/lib/auth";
import { PlayerSkill } from "@/models/PlayerSkill";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  plannedDate: z.string().optional(),
  doneDate: z.string().optional(),
  status: z.enum(["plan", "w_trakcie", "zrobione"]).optional(),
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (parsed.data.plannedDate !== undefined) update.plannedDate = parsed.data.plannedDate ? new Date(parsed.data.plannedDate) : null;
  if (parsed.data.doneDate !== undefined) update.doneDate = parsed.data.doneDate ? new Date(parsed.data.doneDate) : null;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.rating !== undefined) update.rating = parsed.data.rating;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;

  const updated = await PlayerSkill.findByIdAndUpdate(id, update, { new: true });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const deleted = await PlayerSkill.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}