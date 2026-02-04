// src/app/api/skills/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Skill } from "@/models/Skill";
import { skillSchema } from "@/lib/validators";
import { requireRole } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  await requireRole(["admin", "trainer", "viewer"]);
  await dbConnect();
  const doc = await Skill.findById(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: Ctx) {
  await requireRole(["admin", "trainer"]);
  await dbConnect();

  const body = await req.json();
  const parsed = skillSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await Skill.findByIdAndUpdate(params.id, parsed.data, { new: true });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Ctx) {
  await requireRole(["admin"]);
  await dbConnect();

  const deleted = await Skill.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
