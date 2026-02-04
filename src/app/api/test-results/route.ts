import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { TestResult } from "@/models/TestResult";
import { testResultSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const testId = searchParams.get("testId");

  const filter: Record<string, unknown> = {};
  if (playerId) filter.playerId = playerId;
  if (testId) filter.testId = testId;

  const docs = await TestResult.find(filter).sort({ date: -1 });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = testResultSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;

  const created = await TestResult.create({
    ...payload,
    date: new Date(payload.date),
  });

  return NextResponse.json(created, { status: 201 });
}
