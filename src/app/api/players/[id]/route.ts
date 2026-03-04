import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { playerSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const doc = await Player.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sessionUser = (auth.session?.user as { role?: string; playerId?: string | null; id?: string } | undefined) ?? undefined;
  const role = sessionUser?.role;
  if (role === "player" && String(doc._id) !== String(sessionUser?.playerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "club_trainer") {
    const ownUserId = String(sessionUser?.id ?? "");
    const assigned = (doc.trainers ?? []).some((trainerId: unknown) => String(trainerId) === ownUserId);
    if (!assigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "player") {
    const safeDoc = doc.toObject();
    delete safeDoc.notes;
    delete safeDoc.coachNotes;
    return NextResponse.json(safeDoc);
  }

  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const body = await req.json();
  // allow partial updates (e.g. only trainers) — use partial schema
  const parsed = playerSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;
  const updated = await Player.findByIdAndUpdate(
    id,
    { ...payload, birthDate: payload.birthDate ? new Date(payload.birthDate) : undefined },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const deleted = await Player.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
