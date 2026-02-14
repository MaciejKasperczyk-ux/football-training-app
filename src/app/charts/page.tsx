"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface Stats {
  playersCount: number;
  trainingsCount: number;
  goalsCount: number;
  trainingsLast7: number;
  trainingsByDay: any[];
  goalsByStatus: any[];
  skillsDistribution: any[];
  playersData: any[];
  trainingTrend: any[];
}

export default function ChartsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/charts");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-slate-600">Ładowanie wykresów...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-slate-600">Nie udało się załadować danych</div>
        </div>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const statusColors = {
    done: "#10b981",
    in_progress: "#f59e0b",
    planned: "#3b82f6",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50 to-blue-50 p-8 shadow-lg">
        <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Analityka</div>
        <div className="mt-2 text-4xl font-bold text-slate-900">Wykresy i statystyki</div>
        <div className="mt-3 text-base text-slate-600">Wizualne podsumowanie danych z Futbolucja</div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Zawodnicy</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.playersCount}</div>
          <div className="mt-2 text-xs text-slate-500">W systemie</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Treningi</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.trainingsCount}</div>
          <div className="mt-2 text-xs text-slate-500">Zaplanowano</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Cele</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.goalsCount}</div>
          <div className="mt-2 text-xs text-slate-500">Aktywne</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Ostatnie 7 dni</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.trainingsLast7}</div>
          <div className="mt-2 text-xs text-slate-500">Treningi</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Training Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">📈 Trend treningów (ostatnie 14 dni)</h3>
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
                name="Liczba treningów"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goals by Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">🎯 Cele wg statusu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.goalsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.goalsByStatus.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={statusColors[entry.name as keyof typeof statusColors] || COLORS[index]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Skills Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">⭐ Umiejętności - rozkład</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.skillsDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="average" fill="#10b981" radius={[8, 8, 0, 0]} name="Średnia ocena" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trainings by Day */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">📅 Treningi wg dnia tygodnia</h3>
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
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Liczba treningów" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Players */}
      {stats.playersData && stats.playersData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">🏆 Top zawodnicy (wg liczby treningów)</h3>
          <div className="grid grid-cols-1 gap-3">
            {stats.playersData.slice(0, 5).map((player: any, index: number) => (
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
                  <div className="text-xs text-slate-500">treningów</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back Link */}
      <div className="text-center pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          ← Powrót do dashboardu
        </Link>
      </div>
    </div>
  );
}
