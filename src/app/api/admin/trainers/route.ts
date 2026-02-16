import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireRoleApi } from "@/lib/auth";
import { AGE_GROUP_OPTIONS, normalizeAgeGroup, type AgeGroup } from "@/lib/ageGroups";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

type TrainerDoc = {
  _id: unknown;
  email?: string;
  name?: string;
  phone?: string;
  club?: string;
  yearGroup?: string;
  yearGroups?: unknown[];
  role?: string;
  createdAt?: Date | string;
};

export const createTrainerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1, "Telefon jest wymagany"),
  club: z.string().min(1, "Klub jest wymagany"),
  yearGroups: z.array(z.enum(AGE_GROUP_OPTIONS)).min(1, "Wybierz co najmniej jedną grupę"),
});

function generateTemporaryPassword(): string {
  return randomBytes(8).toString("hex");
}

function normalizeGroups(values: unknown[] | undefined, legacyValue?: string): AgeGroup[] {
  const fromArray = (values ?? []).map((value) => normalizeAgeGroup(String(value))).filter((value): value is AgeGroup => value !== null);
  if (fromArray.length) return fromArray;
  if (legacyValue) {
    const parsed = normalizeAgeGroup(legacyValue);
    if (parsed) return [parsed];
  }
  return [];
}

function serializeTrainer(trainer: TrainerDoc) {
  const yearGroups = normalizeGroups(trainer.yearGroups, trainer.yearGroup);
  return {
    _id: trainer._id,
    email: trainer.email ?? "",
    name: trainer.name ?? "",
    phone: trainer.phone ?? "",
    club: trainer.club ?? "",
    yearGroups,
    role: trainer.role ?? "trainer",
    createdAt: trainer.createdAt ?? null,
  };
}

export async function GET() {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const trainers = (await User.find({ role: "trainer" })
    .select("email name phone club yearGroups yearGroup role createdAt")
    .sort({ createdAt: -1 })
    .lean()) as TrainerDoc[];

  return NextResponse.json(trainers.map(serializeTrainer));
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const body = await req.json();
  const parsed = createTrainerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (exists) return NextResponse.json({ error: "Trener już istnieje" }, { status: 409 });

  const temporaryPassword = generateTemporaryPassword();
  const hash = await bcrypt.hash(temporaryPassword, 10);

  const created = (await User.create({
    email: parsed.data.email.toLowerCase(),
    name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    phone: parsed.data.phone,
    club: parsed.data.club,
    yearGroups: parsed.data.yearGroups,
    yearGroup: parsed.data.yearGroups[0],
    role: "trainer",
    passwordHash: hash,
    hasPasswordChanged: false,
  })) as TrainerDoc;

  return NextResponse.json(
    {
      ...serializeTrainer(created),
      temporaryPassword,
    },
    { status: 201 }
  );
}
