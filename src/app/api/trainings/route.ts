import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { Player } from "@/models/Player";
import { trainingSchema } from "@/lib/validators";
import { requireRoleApi } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  let playerId = searchParams.get("playerId");
  const role = (auth.session?.user as any)?.role;
  const ownPlayerId = (auth.session?.user as any)?.playerId;
  const ownUserId = (auth.session?.user as any)?.id;

  if (role === "player") {
    if (!ownPlayerId) return NextResponse.json([], { status: 200 });
    if (playerId && String(playerId) !== String(ownPlayerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    playerId = String(ownPlayerId);
  }

  if (role === "club_trainer") {
    if (!ownUserId) return NextResponse.json([], { status: 200 });
    if (playerId) {
      const assigned = await Player.exists({ _id: playerId, trainers: ownUserId });
      if (!assigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      const assignedPlayers = await Player.find({ trainers: ownUserId }).select("_id").lean();
      const assignedIds = assignedPlayers.map((player) => String((player as { _id: unknown })._id));
      if (assignedIds.length === 0) return NextResponse.json([], { status: 200 });
      const docs = await TrainingSession.find({ players: { $in: assignedIds } }).sort({ date: -1 });
      return NextResponse.json(docs);
    }
  }

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
