// src/app/api/players/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { requireRoleApi } from "@/lib/auth";

export async function GET() {
  const auth = await requireRoleApi(["admin", "trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const role = (auth.session?.user as any)?.role;
  const ownPlayerId = (auth.session?.user as any)?.playerId;

  if (role === "player") {
    if (!ownPlayerId) return NextResponse.json([], { status: 200 });
    const player = await Player.findById(ownPlayerId);
    return NextResponse.json(player ? [player] : [], { status: 200 });
  }

  const players = await Player.find().sort({ lastName: 1, firstName: 1 });
  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const body = await req.json();

  if (!body?.firstName || !body?.lastName) {
    return NextResponse.json({ error: "firstName and lastName are required" }, { status: 400 });
  }

  const created = await Player.create({
    firstName: String(body.firstName),
    lastName: String(body.lastName),
    club: body.club ? String(body.club) : undefined,
    position: body.position ? String(body.position) : undefined,
    age: typeof body.age === "number" ? body.age : undefined,
    birthDate: body.birthDate ? new Date(String(body.birthDate)) : undefined,
    dominantFoot: body.dominantFoot ? String(body.dominantFoot) : undefined,
    trainers: Array.isArray(body.trainers) ? body.trainers.map((x: any) => String(x)) : undefined,
  });

  return NextResponse.json(created, { status: 201 });
}
