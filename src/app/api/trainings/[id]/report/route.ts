import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { TrainingSession } from "@/models/TrainingSession";
import { PlayerSkill } from "@/models/PlayerSkill";
import { requireRoleApi } from "@/lib/auth";
import { z } from "zod";
import { isValidObjectId } from "mongoose";

const reportSchema = z.object({
  reports: z
    .array(
      z.object({
        playerId: z.string().min(1),
        skillId: z.string().min(1),
        detailId: z.string().optional(),
        learned: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .min(1),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin", "trainer"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid training id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const now = new Date();

  // ensure session exists
  const session = await TrainingSession.findById(id);
  if (!session) return NextResponse.json({ error: "Training not found" }, { status: 404 });

  const results: Array<{ playerId: string; skillId: string; ok: boolean; updated: string }> = [];

  for (const r of parsed.data.reports) {
    if (r.learned) {
      const updated = await PlayerSkill.findOneAndUpdate(
        { playerId: r.playerId, skillId: r.skillId, detailId: r.detailId ?? null },
        { $set: { status: "zrobione", doneDate: now, notes: r.notes ?? undefined } },
        { upsert: true, new: true }
      );
      results.push({ playerId: r.playerId, skillId: r.skillId, ok: true, updated: String(updated._id) });
    } else {
      // mark as in progress
      const updated = await PlayerSkill.findOneAndUpdate(
        { playerId: r.playerId, skillId: r.skillId, detailId: r.detailId ?? null },
        { $set: { status: "w_trakcie", doneDate: null, notes: r.notes ?? undefined } },
        { upsert: true, new: true }
      );
      results.push({ playerId: r.playerId, skillId: r.skillId, ok: true, updated: String(updated._id) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
