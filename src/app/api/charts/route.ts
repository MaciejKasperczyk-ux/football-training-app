import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { Goal } from "@/models/Goal";
import { Skill } from "@/models/Skill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

type IdLike = { toString(): string };

interface PlayerLean {
  _id: IdLike;
  firstName: string;
  lastName: string;
  position?: string;
  club?: string;
}

interface TrainingEntryLean {
  skillId?: IdLike;
}

interface TrainingSessionLean {
  date: Date | string;
  players?: IdLike[];
  entries?: TrainingEntryLean[];
}

interface SkillLean {
  _id: IdLike;
  name: string;
}

function toLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeClub(club?: string | null) {
  const value = (club ?? "").trim();
  return value.length > 0 ? value : "Bez klubu";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const playersCount = await Player.countDocuments();
    const trainingsCount = await TrainingSession.countDocuments();
    const goalsCount = await Goal.countDocuments({ status: { $ne: "done" } });

    const players = await Player.find({}, { firstName: 1, lastName: 1, position: 1, club: 1 }).lean();
    const allTrainings = await TrainingSession.find({}, { date: 1, players: 1, entries: 1 }).lean();
    const skills = await Skill.find({}, { name: 1 }).lean();

    const typedPlayers = players as PlayerLean[];
    const typedTrainings = allTrainings as TrainingSessionLean[];
    const typedSkills = skills as SkillLean[];

    const skillNameById = new Map<string, string>();
    for (const skill of typedSkills) {
      skillNameById.set(skill._id.toString(), skill.name);
    }

    const playerInfoById = new Map<
      string,
      {
        id: string;
        name: string;
        position: string;
        club: string;
      }
    >();

    const clubPlayersCountMap = new Map<string, number>();
    for (const player of typedPlayers) {
      const playerId = player._id.toString();
      const club = normalizeClub(player.club);
      playerInfoById.set(playerId, {
        id: playerId,
        name: `${player.firstName} ${player.lastName}`.trim(),
        position: player.position ?? "Brak pozycji",
        club,
      });
      clubPlayersCountMap.set(club, (clubPlayersCountMap.get(club) ?? 0) + 1);
    }

    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    last7.setHours(0, 0, 0, 0);
    let trainingsLast7 = 0;

    const trainingTrendSeed = new Map<string, { date: string; count: number }>();
    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const key = toLocalDayKey(day);
      trainingTrendSeed.set(key, {
        date: day.toLocaleDateString("pl-PL"),
        count: 0,
      });
    }

    const trainingsByMonthSeed = new Map<string, { month: string; count: number }>();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setHours(0, 0, 0, 0);
      const key = toLocalMonthKey(monthDate);
      trainingsByMonthSeed.set(key, {
        month: monthDate.toLocaleDateString("pl-PL", { month: "short", year: "numeric" }),
        count: 0,
      });
    }

    const playerTrainingsCountMap = new Map<string, number>();
    const skillRealizationMap = new Map<string, number>();
    const clubReportsMap = new Map<
      string,
      {
        club: string;
        trainingsCount: number;
        playersCount: number;
        skillsMap: Map<string, number>;
      }
    >();

    for (const [club, playersInClubCount] of clubPlayersCountMap.entries()) {
      clubReportsMap.set(club, {
        club,
        trainingsCount: 0,
        playersCount: playersInClubCount,
        skillsMap: new Map<string, number>(),
      });
    }

    const trainingsByDay = [
      { day: "Pn", count: 0 },
      { day: "Wt", count: 0 },
      { day: "Sr", count: 0 },
      { day: "Czw", count: 0 },
      { day: "Pt", count: 0 },
      { day: "Sb", count: 0 },
      { day: "Nd", count: 0 },
    ];

    for (const training of typedTrainings) {
      const trainingDate = new Date(training.date);
      if (trainingDate >= last7) {
        trainingsLast7 += 1;
      }

      const dayKey = toLocalDayKey(trainingDate);
      const trendPoint = trainingTrendSeed.get(dayKey);
      if (trendPoint) {
        trendPoint.count += 1;
      }

      const monthKey = toLocalMonthKey(trainingDate);
      const monthPoint = trainingsByMonthSeed.get(monthKey);
      if (monthPoint) {
        monthPoint.count += 1;
      }

      const dayOfWeek = trainingDate.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      trainingsByDay[dayIndex].count += 1;

      const playerIds: string[] = Array.isArray(training.players)
        ? [...new Set(training.players.map((id) => id.toString()))]
        : [];
      const entries: TrainingEntryLean[] = Array.isArray(training.entries) ? training.entries : [];

      for (const playerId of playerIds) {
        playerTrainingsCountMap.set(playerId, (playerTrainingsCountMap.get(playerId) ?? 0) + 1);
        const playerInfo = playerInfoById.get(playerId);
        const club = playerInfo?.club ?? "Bez klubu";

        if (!clubReportsMap.has(club)) {
          clubReportsMap.set(club, {
            club,
            trainingsCount: 0,
            playersCount: 0,
            skillsMap: new Map<string, number>(),
          });
        }

        const clubReport = clubReportsMap.get(club)!;
        clubReport.trainingsCount += 1;

        for (const entry of entries) {
          const skillId = entry?.skillId?.toString();
          if (!skillId) {
            continue;
          }
          const skillName = skillNameById.get(skillId) ?? "Nieznana umiejetnosc";
          clubReport.skillsMap.set(skillName, (clubReport.skillsMap.get(skillName) ?? 0) + 1);
          skillRealizationMap.set(skillName, (skillRealizationMap.get(skillName) ?? 0) + 1);
        }
      }
    }

    const goalsByStatus = [
      { name: "done", value: await Goal.countDocuments({ status: "done" }) },
      { name: "in_progress", value: await Goal.countDocuments({ status: "in_progress" }) },
      { name: "planned", value: await Goal.countDocuments({ status: "planned" }) },
    ];

    const trainingTrend = Array.from(trainingTrendSeed.values());
    const trainingsByMonth = Array.from(trainingsByMonthSeed.values());

    const skillsDistribution = Array.from(skillRealizationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const playersData = typedPlayers
      .map((player) => ({
        _id: player._id.toString(),
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position ?? "Brak pozycji",
        trainingsCount: playerTrainingsCountMap.get(player._id.toString()) ?? 0,
      }))
      .sort((a, b) => b.trainingsCount - a.trainingsCount)
      .slice(0, 10);

    const trainingsByPlayer = typedPlayers
      .map((player) => ({
        playerId: player._id.toString(),
        playerName: `${player.firstName} ${player.lastName}`.trim(),
        club: normalizeClub(player.club),
        trainingsCount: playerTrainingsCountMap.get(player._id.toString()) ?? 0,
      }))
      .sort((a, b) => b.trainingsCount - a.trainingsCount);

    const clubReports = Array.from(clubReportsMap.values())
      .map((clubReport) => ({
        club: clubReport.club,
        trainingsCount: clubReport.trainingsCount,
        playersCount: clubReport.playersCount,
        skills: Array.from(clubReport.skillsMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.trainingsCount - a.trainingsCount);

    const clubs = clubReports.map((report) => report.club);

    return NextResponse.json({
      playersCount,
      trainingsCount,
      goalsCount,
      trainingsLast7,
      trainingTrend,
      trainingsByMonth,
      goalsByStatus,
      trainingsByDay,
      skillsDistribution,
      playersData,
      trainingsByPlayer,
      clubReports,
      clubs,
    });
  } catch (error) {
    console.error("Error fetching charts data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
