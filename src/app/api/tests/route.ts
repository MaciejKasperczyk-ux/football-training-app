import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Test } from "@/models/Test";
import { testSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

export async function GET() {
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const docs = await Test.find().sort({ name: 1 });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await Test.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
