import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { Player } from "@/models/Player";
import { trainingSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";
import { isValidObjectId } from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid training id" }, { status: 400 });
  const doc = await TrainingSession.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (auth.session?.user as any)?.role;
  const ownPlayerId = (auth.session?.user as any)?.playerId;
  const ownUserId = (auth.session?.user as any)?.id;
  if (role === "player") {
    const hasAccess = (doc.players ?? []).some((pid: any) => String(pid) === String(ownPlayerId ?? ""));
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "club_trainer") {
    if (!ownUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const trainingPlayerIds = (doc.players ?? []).map((pid: unknown) => String(pid));
    const assignedPlayers = await Player.find({ _id: { $in: trainingPlayerIds }, trainers: ownUserId }).select("_id").lean();
    if (assignedPlayers.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid training id" }, { status: 400 });
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = trainingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;

  const updated = await TrainingSession.findByIdAndUpdate(
    id,
    { ...payload, date: new Date(payload.date) },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid training id" }, { status: 400 });
  const deleted = await TrainingSession.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
