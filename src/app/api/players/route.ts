// src/app/api/players/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { PlayerSkill } from "@/models/PlayerSkill";
import { requireRoleApi } from "@/lib/auth";
import type { DiscAssignedTo } from "@/lib/disc";

type InitialSkillPayload = {
  skillId: string;
  detailIds?: string[];
};

export async function GET() {
  const auth = await requireRoleApi(["admin", "trainer", "club_trainer", "viewer", "player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const role = (auth.session?.user as any)?.role;
  const ownPlayerId = (auth.session?.user as any)?.playerId;
  const ownUserId = (auth.session?.user as any)?.id;

  if (role === "player") {
    if (!ownPlayerId) return NextResponse.json([], { status: 200 });
    const player = await Player.findById(ownPlayerId);
    return NextResponse.json(player ? [player] : [], { status: 200 });
  }

  if (role === "club_trainer") {
    if (!ownUserId) return NextResponse.json([], { status: 200 });
    const players = await Player.find({ trainers: ownUserId }).sort({ lastName: 1, firstName: 1 });
    return NextResponse.json(players);
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

  const discAssignedTo: DiscAssignedTo = body.discAssignedTo === "admin" ? "admin" : "player";

  const created = await Player.create({
    firstName: String(body.firstName),
    lastName: String(body.lastName),
    club: body.club ? String(body.club) : undefined,
    position: body.position ? String(body.position) : undefined,
    age: typeof body.age === "number" ? body.age : undefined,
    birthDate: body.birthDate ? new Date(String(body.birthDate)) : undefined,
    dominantFoot: body.dominantFoot ? String(body.dominantFoot) : undefined,
    trainers: Array.isArray(body.trainers) ? body.trainers.map((x: any) => String(x)) : undefined,
    discAssignedTo,
    discStatus: "pending",
  });

  const initialSkills: InitialSkillPayload[] = Array.isArray(body.initialSkills) ? body.initialSkills : [];
  const operations: Array<{
    playerId: string;
    skillId: string;
    detailId?: string;
    status: "plan";
  }> = [];
  for (const item of initialSkills) {
    const skillId = String(item?.skillId ?? "").trim();
    if (!skillId) continue;
    const detailIds = Array.isArray(item?.detailIds) ? item.detailIds.map((detailId) => String(detailId).trim()).filter(Boolean) : [];
    if (detailIds.length > 0) {
      for (const detailId of detailIds) {
        operations.push({
          playerId: String(created._id),
          skillId,
          detailId,
          status: "plan",
        });
      }
    } else {
      operations.push({
        playerId: String(created._id),
        skillId,
        status: "plan",
      });
    }
  }

  if (operations.length > 0) {
    await Promise.all(
      operations.map((operation) =>
        PlayerSkill.findOneAndUpdate(
          {
            playerId: operation.playerId,
            skillId: operation.skillId,
            detailId: operation.detailId ?? null,
          },
          { $set: operation },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );
  }

  return NextResponse.json(created, { status: 201 });
}
