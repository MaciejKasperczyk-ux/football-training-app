import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { requireRoleApi } from "@/lib/auth";
import { PlayerSkill } from "@/models/PlayerSkill";
import { Player } from "@/models/Player";
import { z } from "zod";

type SessionUser = { role?: "admin" | "trainer" | "club_trainer" | "viewer" | "player"; playerId?: string | null; id?: string | null };

const createSchema = z.object({
  playerId: z.string().min(1),
  skillId: z.string().min(1),
  detailId: z.string().optional(),
  plannedDate: z.string().optional(),
  doneDate: z.string().optional(),
  status: z.enum(["plan", "w_trakcie", "zrobione"]).optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  let playerId = searchParams.get("playerId");
  const user = (auth.session?.user as SessionUser | undefined) ?? undefined;
  const role = user?.role;
  const ownPlayerId = user?.playerId;
  const ownUserId = user?.id;

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
      const docs = await PlayerSkill.find({ playerId: { $in: assignedIds } }).sort({ updatedAt: -1 });
      return NextResponse.json(docs);
    }
  }

  if (!playerId) return NextResponse.json({ error: "playerId is required" }, { status: 400 });

  const docs = await PlayerSkill.find({ playerId }).sort({ updatedAt: -1 });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  const user = (auth.session?.user as SessionUser | undefined) ?? undefined;
  const role = user?.role;
  const ownPlayerId = user?.playerId;
  const ownUserId = user?.id;

  await dbConnect();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const targetPlayerId = parsed.data.playerId;

  if (role === "player") {
    if (!ownPlayerId || String(targetPlayerId) !== String(ownPlayerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (role === "club_trainer") {
    if (!ownUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const assigned = await Player.exists({ _id: targetPlayerId, trainers: ownUserId });
    if (!assigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upserted = await PlayerSkill.findOneAndUpdate(
    {
      playerId: targetPlayerId,
      skillId: parsed.data.skillId,
      detailId: parsed.data.detailId ?? null,
    },
    {
      $set: {
        plannedDate: parsed.data.plannedDate ? new Date(parsed.data.plannedDate) : undefined,
        doneDate: parsed.data.doneDate ? new Date(parsed.data.doneDate) : parsed.data.status === "zrobione" ? undefined : null,
        status: parsed.data.status ?? "plan",
        notes: parsed.data.notes,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json(upserted, { status: 201 });
}
