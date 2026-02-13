import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { requireRoleApi } from "@/lib/auth";
import { Player } from "@/models/Player";
import { User } from "@/models/User";
import { Types } from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  email: z.string().email(),
});

function generateTemporaryPassword() {
  return randomBytes(8).toString("hex");
}

export async function GET(_: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }

  await dbConnect();
  const account = await User.findOne({ role: "player", playerId: id }).select("_id email name role playerId hasPasswordChanged createdAt");
  return NextResponse.json({ account });
}

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await dbConnect();

  const player = await Player.findById(id).lean();
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const existingByEmail = await User.findOne({ email: parsed.data.email.toLowerCase().trim() });
  const existingByPlayer = await User.findOne({ role: "player", playerId: id });
  const temporaryPassword = generateTemporaryPassword();
  const hash = await bcrypt.hash(temporaryPassword, 10);

  if (existingByPlayer) {
    if (existingByEmail && String(existingByEmail._id) !== String(existingByPlayer._id)) {
      return NextResponse.json({ error: "Email zajety przez inne konto" }, { status: 409 });
    }

    existingByPlayer.email = parsed.data.email.toLowerCase().trim();
    existingByPlayer.passwordHash = hash;
    existingByPlayer.hasPasswordChanged = false;
    existingByPlayer.role = "player";
    existingByPlayer.playerId = id as any;
    await existingByPlayer.save();

    await Player.findByIdAndUpdate(id, { userId: existingByPlayer._id });

    return NextResponse.json({
      mode: "reset",
      accountId: String(existingByPlayer._id),
      email: existingByPlayer.email,
      temporaryPassword,
    });
  }

  if (existingByEmail) {
    return NextResponse.json({ error: "Email zajety przez inne konto" }, { status: 409 });
  }

  const created = await User.create({
    email: parsed.data.email.toLowerCase().trim(),
    name: `${(player as any).firstName ?? ""} ${(player as any).lastName ?? ""}`.trim() || "Player",
    role: "player",
    playerId: id,
    passwordHash: hash,
    hasPasswordChanged: false,
  });

  await Player.findByIdAndUpdate(id, { userId: created._id });

  return NextResponse.json(
    {
      mode: "created",
      accountId: String(created._id),
      email: created.email,
      temporaryPassword,
    },
    { status: 201 }
  );
}
