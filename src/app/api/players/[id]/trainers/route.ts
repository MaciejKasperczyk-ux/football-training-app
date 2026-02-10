import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { requireRoleApi } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireRoleApi(["admin", "trainer", "viewer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const player = await Player.findById(id).populate("trainers").lean();
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(player.trainers || []);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.trainers)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const trainers = body.trainers.map((x: any) => String(x));

  const updated = await Player.findByIdAndUpdate(id, { trainers }, { new: true }).populate("trainers").lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated.trainers || []);
}
