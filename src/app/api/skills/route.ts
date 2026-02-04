import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Skill } from "@/models/Skill";
import { skillSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

export async function GET() {
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const skills = await Skill.find().sort({ name: 1 });
  return NextResponse.json(skills);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = skillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await Skill.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
