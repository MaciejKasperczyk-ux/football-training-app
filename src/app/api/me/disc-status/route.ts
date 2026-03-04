import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";

export async function GET() {
  const auth = await requireRoleApi(["player"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const user = (auth.session?.user as { playerId?: string | null } | undefined) ?? undefined;
  const playerId = String(user?.playerId ?? "");
  if (!playerId) return NextResponse.json({ mustFill: false, playerId: null });

  await dbConnect();
  const player = await Player.findById(playerId).select("discAssignedTo discStatus").lean();
  if (!player) return NextResponse.json({ mustFill: false, playerId });

  const assignedTo = (player as any).discAssignedTo ?? "player";
  const discStatus = (player as any).discStatus ?? "pending";
  const mustFill = assignedTo === "player" && discStatus !== "completed";
  return NextResponse.json({ mustFill, playerId });
}
