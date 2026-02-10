import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireRoleApi } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const createTrainerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

function generateTemporaryPassword(): string {
  return randomBytes(8).toString("hex");
}

export async function GET() {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const trainers = await User.find({ role: "trainer" }).select("email name role createdAt").sort({ createdAt: -1 });
  return NextResponse.json(trainers);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = createTrainerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) return NextResponse.json({ error: "Trener już istnieje" }, { status: 409 });

  const temporaryPassword = generateTemporaryPassword();
  const hash = await bcrypt.hash(temporaryPassword, 10);

  const created = await User.create({
    email: parsed.data.email,
    name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    role: "trainer",
    passwordHash: hash,
    hasPasswordChanged: false,
  });

  return NextResponse.json(
    {
      id: created._id,
      email: created.email,
      name: created.name,
      role: created.role,
      temporaryPassword,
    },
    { status: 201 }
  );
}
