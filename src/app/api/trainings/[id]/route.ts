import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { trainingSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  const doc = await TrainingSession.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
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
  const deleted = await TrainingSession.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}