import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { SubSkill } from "@/models/SubSkill";
import { requireRoleApi } from "@/lib/auth";
import { z } from "zod";

const subSkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.number().int().min(1).max(3).optional(),
});

export async function GET() {
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const subs = await SubSkill.find().sort({ difficulty: 1, name: 1 });
  return NextResponse.json(subs);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = subSkillSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await SubSkill.create({
    ...parsed.data,
    difficulty: parsed.data.difficulty ?? 1,
  });
  return NextResponse.json(created, { status: 201 });
}
