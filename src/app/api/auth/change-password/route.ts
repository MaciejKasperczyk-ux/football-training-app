import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";
import bcrypt from "bcryptjs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isPasswordValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  user.passwordHash = newHash;
  user.hasPasswordChanged = true;
  await user.save();

  return NextResponse.json({ message: "Password changed successfully" });
}
