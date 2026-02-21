import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRoleApi } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { PlayerSkill } from "@/models/PlayerSkill";
import { Goal } from "@/models/Goal";
import { Skill } from "@/models/Skill";
import { User } from "@/models/User";

const bodySchema = z.object({
  action: z.enum(["wipe_players", "generate_players", "simulate_trainings"]),
  count: z.number().int().min(1).max(200).optional(),
});

type DetailItem = { _id: string; name: string; difficulty?: 1 | 2 | 3 };
type SkillItem = { _id: string; name: string; details?: DetailItem[] };

const firstNames = ["Jan", "Adam", "Marek", "Kacper", "Mikolaj", "Pawel", "Tomasz", "Igor", "Filip", "Oskar"];
const lastNames = ["Kowalski", "Nowak", "Wojcik", "Lewandowski", "Kaminski", "Zielinski", "Szymanski", "Witkowski", "Dabrowski", "Piotrowski"];
const clubs = ["AP Orly", "KS Zieloni", "MKS Start", "UKS Junior", "Akademia Progres"];
const positions = ["Bramkarz", "Obronca", "Pomocnik", "Napastnik"];
const feet: Array<"left" | "right" | "both"> = ["left", "right", "both"];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function randomPastDate(daysBack = 60) {
  const now = new Date();
  const offset = randInt(0, daysBack);
  const d = new Date(now);
  d.setDate(now.getDate() - offset);
  return d;
}

function randomBirthDate(age: number) {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = randInt(0, 11);
  const day = randInt(1, 28);
  return new Date(year, month, day);
}

export async function POST(req: Request) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await dbConnect();

  if (parsed.data.action === "wipe_players") {
    const playerDocs = await Player.find({}, { _id: 1 }).lean();
    const playerIds = playerDocs.map((p) => p._id);

    if (playerIds.length === 0) {
      return NextResponse.json({
        ok: true,
        action: "wipe_players",
        deletedPlayers: 0,
        deletedTrainings: 0,
        deletedPlayerSkills: 0,
        deletedGoals: 0,
      });
    }

    const [trainingsRes, playerSkillsRes, goalsRes, usersRes, playersRes] = await Promise.all([
      TrainingSession.deleteMany({ players: { $in: playerIds } }),
      PlayerSkill.deleteMany({ playerId: { $in: playerIds } }),
      Goal.deleteMany({ playerId: { $in: playerIds } }),
      User.updateMany({ playerId: { $in: playerIds } }, { $unset: { playerId: "" } }),
      Player.deleteMany({ _id: { $in: playerIds } }),
    ]);

    return NextResponse.json({
      ok: true,
      action: "wipe_players",
      deletedPlayers: playersRes.deletedCount ?? 0,
      deletedTrainings: trainingsRes.deletedCount ?? 0,
      deletedPlayerSkills: playerSkillsRes.deletedCount ?? 0,
      deletedGoals: goalsRes.deletedCount ?? 0,
      detachedUsers: usersRes.modifiedCount ?? 0,
    });
  }

  if (parsed.data.action === "generate_players") {
    const count = parsed.data.count ?? 5;
    const skills = (await Skill.find().populate("details").lean()) as SkillItem[];

    if (skills.length === 0) {
      return NextResponse.json({ error: "Brak umiejetnosci. Najpierw uzupelnij biblioteke." }, { status: 400 });
    }

    const createdPlayers = [];
    let createdSkillLinks = 0;
    let createdGoals = 0;
    const trainers = await User.find({ role: { $in: ["admin", "trainer"] } }, { _id: 1 }).lean();

    for (let i = 0; i < count; i += 1) {
      const age = randInt(10, 18);
      const assignedTrainerIds =
        trainers.length > 0
          ? pickMany(trainers, randInt(1, Math.min(2, trainers.length))).map((trainer) => trainer._id)
          : [];

      const player = await Player.create({
        firstName: pickOne(firstNames),
        lastName: `${pickOne(lastNames)}-${randInt(10, 99)}`,
        age,
        birthDate: randomBirthDate(age),
        club: pickOne(clubs),
        position: pickOne(positions),
        dominantFoot: pickOne(feet),
        trainers: assignedTrainerIds,
        isActive: true,
      });

      createdPlayers.push(player);

      const chosenSkills = pickMany(skills, randInt(Math.min(4, skills.length), Math.min(9, skills.length)));
      for (const skill of chosenSkills) {
        const details = skill.details ?? [];
        const detailCount = details.length > 0 ? randInt(1, Math.min(3, details.length)) : 0;
        const chosenDetails = detailCount > 0 ? pickMany(details, detailCount) : [];

        for (const detail of chosenDetails) {
          const status = Math.random() > 0.45 ? "zrobione" : "w_trakcie";
          await PlayerSkill.findOneAndUpdate(
            {
              playerId: player._id,
              skillId: skill._id,
              detailId: detail._id,
            },
            {
              $set: {
                status,
                plannedDate: randomPastDate(30),
                doneDate: status === "zrobione" ? randomPastDate(15) : undefined,
                notes: "Wygenerowane automatycznie (test data)",
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          createdSkillLinks += 1;
        }
      }

      const goalSkill = pickOne(skills);
      await Goal.create({
        playerId: player._id,
        title: `Cel techniczny: ${goalSkill.name}`,
        description: "Wygenerowany automatycznie do testow.",
        dueDate: new Date(Date.now() + randInt(7, 40) * 24 * 60 * 60 * 1000),
        status: "planned",
        skillId: goalSkill._id,
      });
      createdGoals += 1;
    }

    return NextResponse.json({
      ok: true,
      action: "generate_players",
      requestedCount: count,
      createdPlayers: createdPlayers.length,
      createdSkillLinks,
      createdGoals,
    });
  }

  const count = parsed.data.count ?? 8;
  const players = await Player.find({}, { _id: 1 }).lean();
  const skills = (await Skill.find().populate("details").lean()) as SkillItem[];
  const trainers = await User.find({ role: { $in: ["admin", "trainer"] } }, { _id: 1 }).lean();

  if (players.length === 0) {
    return NextResponse.json({ error: "Brak zawodnikow do symulacji." }, { status: 400 });
  }
  if (skills.length === 0) {
    return NextResponse.json({ error: "Brak umiejetnosci do symulacji." }, { status: 400 });
  }

  let createdTrainings = 0;
  let touchedPlayerSkills = 0;

    for (let i = 0; i < count; i += 1) {
      const selectedPlayers = pickMany(players, randInt(1, Math.min(8, players.length)));
      const selectedSkills = pickMany(skills, randInt(2, Math.min(6, skills.length)));
    const entries = selectedSkills.map((skill) => {
      const details = skill.details ?? [];
      const chosenDetail = details.length > 0 && Math.random() > 0.15 ? pickOne(details) : null;
      return {
        skillId: skill._id,
        detailId: chosenDetail?._id,
        volume: randInt(6, 20),
        quality: randInt(2, 5),
        notes: "Symulacja testowa",
      };
    });

    await TrainingSession.create({
      players: selectedPlayers.map((player) => player._id),
      trainerId: trainers.length > 0 ? pickOne(trainers)._id : undefined,
      date: randomPastDate(75),
      durationMinutes: randInt(55, 105),
      location: "Boisko testowe",
      entries,
      notes: "Wygenerowane automatycznie (test data)",
    });
    createdTrainings += 1;

    for (const player of selectedPlayers) {
      for (const entry of entries) {
        if (Math.random() < 0.2) continue;
        const finalStatus = Math.random() > 0.5 ? "zrobione" : "w_trakcie";
        await PlayerSkill.findOneAndUpdate(
          {
            playerId: player._id,
            skillId: entry.skillId,
            detailId: entry.detailId ?? null,
          },
          {
            $set: {
              status: finalStatus,
              plannedDate: randomPastDate(30),
              doneDate: finalStatus === "zrobione" ? randomPastDate(5) : undefined,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        touchedPlayerSkills += 1;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    action: "simulate_trainings",
    requestedCount: count,
    createdTrainings,
    touchedPlayerSkills,
  });
}
