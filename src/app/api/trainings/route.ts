import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { trainingSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  const filter: Record<string, unknown> = {};
  if (playerId) filter.players = playerId;

  const docs = await TrainingSession.find(filter).sort({ date: -1 });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = trainingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;

  const created = await TrainingSession.create({
    ...payload,
    // ensure date is stored as Date
    date: new Date(payload.date),
  });

  return NextResponse.json(created, { status: 201 });
}
