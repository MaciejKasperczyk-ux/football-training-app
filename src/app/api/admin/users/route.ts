// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { userCreateSchema } from "@/lib/validators";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  await requireRole(["admin"]);
  await dbConnect();

  const body = await req.json();
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await User.findOne({ email }).lean();
  if (exists) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const created = await User.create({
    email,
    name: parsed.data.name,
    role: parsed.data.role ?? "trainer",
    passwordHash,
  });

  return NextResponse.json(
    { id: String(created._id), email: created.email, name: created.name, role: created.role },
    { status: 201 }
  );
}
