import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { SubSkill } from "@/models/SubSkill";
import { requireRoleApi } from "@/lib/auth";
import { Types } from "mongoose";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const doc = await SubSkill.findByIdAndDelete(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ message: "Deleted" });
}
