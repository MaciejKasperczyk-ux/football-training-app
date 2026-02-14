import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { Goal } from "@/models/Goal";
import { Skill } from "@/models/Skill";
import { PlayerSkill } from "@/models/PlayerSkill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

const dayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    // Basic counts
    const playersCount = await Player.countDocuments();
    const trainingsCount = await TrainingSession.countDocuments();
    const goalsCount = await Goal.countDocuments({ status: { $ne: "done" } });

    // Last 7 days trainings
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const trainingsLast7 = await TrainingSession.countDocuments({ date: { $gte: last7 } });

    // Training trend - last 14 days
    const trainingTrend = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await TrainingSession.countDocuments({
        date: { $gte: date, $lt: nextDate },
      });

      trainingTrend.push({
        date: date.toLocaleDateString("pl-PL"),
        count,
      });
    }

    // Goals by status
    const goalsByStatus = [
      { name: "done", value: await Goal.countDocuments({ status: "done" }) },
      { name: "in_progress", value: await Goal.countDocuments({ status: "in_progress" }) },
      { name: "planned", value: await Goal.countDocuments({ status: "planned" }) },
    ];

    // Trainings by day of week
    const trainingsByDay = [
      { day: "Pn", count: 0 },
      { day: "Wt", count: 0 },
      { day: "Śr", count: 0 },
      { day: "Czw", count: 0 },
      { day: "Pt", count: 0 },
      { day: "Sb", count: 0 },
      { day: "Nd", count: 0 },
    ];

    const allTrainings = await TrainingSession.find().lean();
    allTrainings.forEach((training: any) => {
      const dayOfWeek = new Date(training.date).getDay();
      const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      trainingsByDay[index].count++;
    });

    // Skills distribution
    const skills = await Skill.find().lean();
    const skillsDistribution = [];

    for (const skill of skills) {
      const playerSkills = await PlayerSkill.find({ skillId: skill._id.toString() }).lean();
      const avgRating = playerSkills.length > 0 ? playerSkills.reduce((sum: number, ps: any) => sum + (ps.rating || 0), 0) / playerSkills.length : 0;
      skillsDistribution.push({
        name: skill.name,
        average: Math.round(avgRating * 10) / 10,
      });
    }

    // Top players by training count
    const playersData = await Player.aggregate([
      {
        $lookup: {
          from: "trainingsessions",
          localField: "_id",
          foreignField: "playerId",
          as: "trainings",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          position: 1,
          trainingsCount: { $size: "$trainings" },
        },
      },
      { $sort: { trainingsCount: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      playersCount,
      trainingsCount,
      goalsCount,
      trainingsLast7,
      trainingTrend,
      goalsByStatus,
      trainingsByDay,
      skillsDistribution,
      playersData,
    });
  } catch (error) {
    console.error("Error fetching charts data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
