import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireRoleApi } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["admin", "trainer", "viewer"]).default("trainer"),
});

export async function GET() {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const users = await User.find().select("email name role createdAt").sort({ createdAt: -1 });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) return NextResponse.json({ error: "Użytkownik już istnieje" }, { status: 409 });

  const hash = await bcrypt.hash(parsed.data.password, 10);

  const created = await User.create({
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    passwordHash: hash,
  });

  return NextResponse.json(
    { id: created._id, email: created.email, name: created.name, role: created.role },
    { status: 201 }
  );
}
