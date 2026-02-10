import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireRoleApi } from "@/lib/auth";
import { Types } from "mongoose";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { id: trainerId } = await params;

  if (!Types.ObjectId.isValid(trainerId)) {
    return NextResponse.json({ error: "Invalid trainer ID" }, { status: 400 });
  }

  const trainer = await User.findByIdAndDelete(trainerId);
  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Trainer deleted" });
}
