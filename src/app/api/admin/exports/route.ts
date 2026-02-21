import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { TrainingSession } from "@/models/TrainingSession";
import { Skill } from "@/models/Skill";
import { Goal } from "@/models/Goal";
import { PlayerSkill } from "@/models/PlayerSkill";
import { User } from "@/models/User";

type Dataset = "players" | "trainings" | "skills" | "goals" | "player-skills";
type Loose = Record<string, unknown>;

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  return lines.join("\n");
}

function asDate(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const auth = await requireRoleApi(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const dataset = (searchParams.get("dataset") ?? "") as Dataset;
  if (!["players", "trainings", "skills", "goals", "player-skills"].includes(dataset)) {
    return NextResponse.json({ error: "Invalid dataset" }, { status: 400 });
  }

  await dbConnect();

  let rows: Array<Record<string, unknown>> = [];

  if (dataset === "players") {
    const players = await Player.find().populate("trainers", "name email").sort({ lastName: 1, firstName: 1 }).lean();
    rows = (players as Loose[]).map((p) => ({
      id: String(p._id ?? ""),
      firstName: String(p.firstName ?? ""),
      lastName: String(p.lastName ?? ""),
      birthDate: asDate(p.birthDate),
      age: p.age ?? "",
      club: String(p.club ?? ""),
      position: String(p.position ?? ""),
      dominantFoot: String(p.dominantFoot ?? ""),
      trainers: Array.isArray(p.trainers)
        ? (p.trainers as Loose[]).map((t) => String(t.name ?? t.email ?? "")).filter(Boolean).join(" | ")
        : "",
      active: p.isActive ? "yes" : "no",
      createdAt: asDate(p.createdAt),
    }));
  }

  if (dataset === "trainings") {
    const trainings = await TrainingSession.find().populate("players", "firstName lastName").populate("trainerId", "name email").sort({ date: -1 }).lean();
    rows = (trainings as Loose[]).map((t) => ({
      id: String(t._id ?? ""),
      date: asDate(t.date),
      playersCount: Array.isArray(t.players) ? t.players.length : 0,
      players: Array.isArray(t.players)
        ? (t.players as Loose[]).map((p) => `${String(p.firstName ?? "")} ${String(p.lastName ?? "")}`.trim()).join(" | ")
        : "",
      trainer: typeof t.trainerId === "object" && t.trainerId ? String((t.trainerId as Loose).name ?? (t.trainerId as Loose).email ?? "") : "",
      entriesCount: Array.isArray(t.entries) ? t.entries.length : 0,
      durationMinutes: t.durationMinutes ?? "",
      location: String(t.location ?? ""),
      notes: String(t.notes ?? ""),
    }));
  }

  if (dataset === "skills") {
    const skills = await Skill.find().populate("details").sort({ name: 1 }).lean();
    rows = (skills as Loose[]).map((s) => ({
      id: String(s._id ?? ""),
      name: String(s.name ?? ""),
      detailsCount: Array.isArray(s.details) ? s.details.length : 0,
      p1: Array.isArray(s.details) ? (s.details as Loose[]).filter((d) => (Number(d.difficulty ?? 1) === 1)).length : 0,
      p2: Array.isArray(s.details) ? (s.details as Loose[]).filter((d) => Number(d.difficulty) === 2).length : 0,
      p3: Array.isArray(s.details) ? (s.details as Loose[]).filter((d) => Number(d.difficulty) === 3).length : 0,
      details: Array.isArray(s.details)
        ? (s.details as Loose[]).map((d) => `[P${Number(d.difficulty ?? 1)}] ${String(d.name ?? "")}`).join(" | ")
        : "",
    }));
  }

  if (dataset === "goals") {
    const goals = await Goal.find().sort({ dueDate: 1 }).lean();
    const users = await User.find({}, { _id: 1, name: 1, email: 1 }).lean();
    const players = await Player.find({}, { _id: 1, firstName: 1, lastName: 1 }).lean();
    const userById = new Map((users as Loose[]).map((u) => [String(u._id ?? ""), u]));
    const playerById = new Map((players as Loose[]).map((p) => [String(p._id ?? ""), p]));
    rows = (goals as Loose[]).map((g) => {
      const p = playerById.get(String(g.playerId ?? ""));
      const u = userById.get(String(g.createdByUserId ?? ""));
      return {
        id: String(g._id ?? ""),
        player: p ? `${String(p.firstName ?? "")} ${String(p.lastName ?? "")}`.trim() : String(g.playerId ?? ""),
        title: String(g.title ?? ""),
        status: String(g.status ?? ""),
        dueDate: asDate(g.dueDate),
        skillId: g.skillId ? String(g.skillId) : "",
        detailId: g.detailId ? String(g.detailId) : "",
        createdBy: u ? String(u.name ?? u.email ?? "") : "",
      };
    });
  }

  if (dataset === "player-skills") {
    const docs = await PlayerSkill.find().sort({ updatedAt: -1 }).lean();
    rows = (docs as Loose[]).map((d) => ({
      id: String(d._id ?? ""),
      playerId: String(d.playerId ?? ""),
      skillId: String(d.skillId ?? ""),
      detailId: d.detailId ? String(d.detailId) : "",
      status: String(d.status ?? ""),
      plannedDate: asDate(d.plannedDate),
      doneDate: asDate(d.doneDate),
      notes: String(d.notes ?? ""),
      updatedAt: asDate(d.updatedAt),
    }));
  }

  const csv = toCsv(rows);
  const filename = `${dataset}-${new Date().toISOString().slice(0, 10)}.csv`;
  const content = `\uFEFF${csv}`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
