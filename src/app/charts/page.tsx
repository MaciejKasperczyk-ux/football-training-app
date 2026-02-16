"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type GoalStatusName = "done" | "in_progress" | "planned";

interface GoalStatusItem {
  name: GoalStatusName;
  value: number;
}

interface TrendItem {
  date: string;
  count: number;
}

interface TrainingsByDayItem {
  day: string;
  count: number;
}

interface SkillsDistributionItem {
  name: string;
  count: number;
}

interface TopPlayerItem {
  _id: string;
  firstName: string;
  lastName: string;
  position: string;
  trainingsCount: number;
}

interface TrainingsByPlayerItem {
  playerId: string;
  playerName: string;
  club: string;
  trainingsCount: number;
}

interface TrainingsByMonthItem {
  month: string;
  count: number;
}

interface ClubSkillItem {
  name: string;
  count: number;
}

interface ClubReportItem {
  club: string;
  trainingsCount: number;
  playersCount: number;
  skills: ClubSkillItem[];
}

interface Stats {
  playersCount: number;
  trainingsCount: number;
  goalsCount: number;
  trainingsLast7: number;
  trainingsByDay: TrainingsByDayItem[];
  goalsByStatus: GoalStatusItem[];
  skillsDistribution: SkillsDistributionItem[];
  playersData: TopPlayerItem[];
  trainingTrend: TrendItem[];
  trainingsByMonth: TrainingsByMonthItem[];
  trainingsByPlayer: TrainingsByPlayerItem[];
  clubReports: ClubReportItem[];
  clubs: string[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const STATUS_COLORS: Record<GoalStatusName, string> = {
  done: "#10b981",
  in_progress: "#f59e0b",
  planned: "#3b82f6",
};

const STATUS_LABELS: Record<GoalStatusName, string> = {
  done: "Wykonane",
  in_progress: "W trakcie",
  planned: "Plan",
};

export default function ChartsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<string>("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/charts");
        if (response.ok) {
          const data: Stats = await response.json();
          setStats(data);
          if (data.clubs.length > 0) {
            setSelectedClub(data.clubs[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const selectedClubReport = useMemo(() => {
    if (!stats || !selectedClub) {
      return null;
    }
    return stats.clubReports.find((report) => report.club === selectedClub) ?? null;
  }, [selectedClub, stats]);

  const trainingsByPlayerTop10 = useMemo(
    () => (stats?.trainingsByPlayer ?? []).slice(0, 10),
    [stats?.trainingsByPlayer]
  );

  const selectedClubSkillsTop10 = useMemo(
    () => (selectedClubReport?.skills ?? []).slice(0, 10),
    [selectedClubReport]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">...</div>
          <div className="text-slate-600">Ladowanie wykresow...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-slate-600">Nie udalo sie zaladowac danych</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50 to-blue-50 p-8 shadow-lg">
        <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Analityka</div>
        <div className="mt-2 text-4xl font-bold text-slate-900">Wykresy i raporty</div>
        <div className="mt-3 text-base text-slate-600">Miesieczne i klubowe zestawienia treningow</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Zawodnicy</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.playersCount}</div>
          <div className="mt-2 text-xs text-slate-500">W systemie</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Treningi</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.trainingsCount}</div>
          <div className="mt-2 text-xs text-slate-500">Lacznie</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Cele</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.goalsCount}</div>
          <div className="mt-2 text-xs text-slate-500">Aktywne</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Ostatnie 7 dni</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.trainingsLast7}</div>
          <div className="mt-2 text-xs text-slate-500">Sesje</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Trend treningow (14 dni)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trainingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5 }}
                activeDot={{ r: 7 }}
                name="Liczba treningow"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Cele wg statusu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.goalsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${STATUS_LABELS[name as GoalStatusName] ?? name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.goalsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, STATUS_LABELS[name as GoalStatusName] ?? name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Umiejetnosci realizowane na treningach</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.skillsDistribution.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} angle={-30} textAnchor="end" height={90} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} name="Liczba realizacji" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Treningi wg dnia tygodnia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.trainingsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Liczba treningow" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ile treningow odbylo sie w danym miesiacu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.trainingsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Treningi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ile treningow odbyli zawodnicy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trainingsByPlayerTop10} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis
                type="category"
                dataKey="playerName"
                stroke="#64748b"
                style={{ fontSize: "11px" }}
                width={130}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="trainingsCount" fill="#6366f1" radius={[0, 8, 8, 0]} name="Treningi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Raport klubu: treningi i realizowane umiejetnosci</h3>
            <p className="text-sm text-slate-500">Sprawdz, ile treningow odbyli zawodnicy z wybranego zespolu.</p>
          </div>
          <div className="w-full sm:w-72">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Klub</label>
            <select
              className="field-select"
              value={selectedClub}
              onChange={(event) => setSelectedClub(event.target.value)}
            >
              {stats.clubs.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClubReport ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Klub</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{selectedClubReport.club}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Treningi zawodnikow</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{selectedClubReport.trainingsCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Liczba zawodnikow</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{selectedClubReport.playersCount}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedClubSkillsTop10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} angle={-25} textAnchor="end" height={85} />
                    <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} name="Realizacje" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">Najczesciej realizowane umiejetnosci</div>
                {selectedClubSkillsTop10.length === 0 ? (
                  <div className="text-sm text-slate-500">Brak danych dla wybranego klubu.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedClubSkillsTop10.map((skill) => (
                      <div
                        key={`${selectedClubReport.club}-${skill.name}`}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">{skill.name}</span>
                        <span className="text-sm font-semibold text-slate-900">{skill.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500">Brak danych klubowych.</div>
        )}
      </div>

      {stats.playersData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top zawodnicy (wg liczby treningow)</h3>
          <div className="grid grid-cols-1 gap-3">
            {stats.playersData.slice(0, 5).map((player, index) => (
              <Link
                key={player._id}
                href={`/players/${player._id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 hover:bg-slate-100 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{player.position || "Brak pozycji"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{player.trainingsCount}</div>
                  <div className="text-xs text-slate-500">treningow</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          {"<-"} Powrot do dashboardu
        </Link>
      </div>
    </div>
  );
}
