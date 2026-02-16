import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireRoleApi } from "@/lib/auth";
import { AGE_GROUP_OPTIONS, normalizeAgeGroup, type AgeGroup } from "@/lib/ageGroups";
import { Types } from "mongoose";
import { z } from "zod";

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

const updateTrainerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1, "Telefon jest wymagany"),
  club: z.string().min(1, "Klub jest wymagany"),
  yearGroups: z.array(z.enum(AGE_GROUP_OPTIONS)).min(1, "Wybierz co najmniej jedną grupę"),
});

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { id: trainerId } = await params;
  if (!Types.ObjectId.isValid(trainerId)) {
    return NextResponse.json({ error: "Invalid trainer ID" }, { status: 400 });
  }

  const trainer = (await User.findOne({ _id: trainerId, role: "trainer" })
    .select("email name phone club yearGroups yearGroup role createdAt")
    .lean()) as TrainerDoc | null;

  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTrainer(trainer));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { id: trainerId } = await params;
  if (!Types.ObjectId.isValid(trainerId)) {
    return NextResponse.json({ error: "Invalid trainer ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateTrainerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const emailLower = parsed.data.email.toLowerCase();
  const duplicate = await User.findOne({ email: emailLower, _id: { $ne: trainerId } }).select("_id").lean();
  if (duplicate) return NextResponse.json({ error: "Użytkownik z tym e-mailem już istnieje" }, { status: 409 });

  const updated = (await User.findOneAndUpdate(
    { _id: trainerId, role: "trainer" },
    {
      email: emailLower,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      phone: parsed.data.phone,
      club: parsed.data.club,
      yearGroups: parsed.data.yearGroups,
      yearGroup: parsed.data.yearGroups[0],
    },
    { new: true }
  )
    .select("email name phone club yearGroups yearGroup role createdAt")
    .lean()) as TrainerDoc | null;

  if (!updated) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTrainer(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  await dbConnect();

  const { id: trainerId } = await params;

  if (!Types.ObjectId.isValid(trainerId)) {
    return NextResponse.json({ error: "Invalid trainer ID" }, { status: 400 });
  }

  const trainer = await User.findByIdAndDelete(trainerId);
  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Trainer deleted" });
}
