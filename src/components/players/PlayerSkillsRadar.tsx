type SkillProgressPoint = {
  id: string;
  name: string;
  done: number;
  total: number;
  ratio: number;
  score: number;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function pointsToString(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function labelAnchor(angleRad: number) {
  const cos = Math.cos(angleRad);
  if (cos > 0.35) return "start";
  if (cos < -0.35) return "end";
  return "middle";
}

export default function PlayerSkillsRadar({ data }: { data: SkillProgressPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="surface p-5">
        <h2 className="section-title">Radar umiejetnosci</h2>
        <p className="mt-2 text-sm text-slate-600">Brak umiejetnosci do wyswietlenia.</p>
      </div>
    );
  }

  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 140;
  const levels = 5;
  const step = (Math.PI * 2) / data.length;

  const axes = data.map((_, idx) => {
    const angle = -Math.PI / 2 + idx * step;
    const outer = polarToCartesian(cx, cy, radius, angle);
    const label = polarToCartesian(cx, cy, radius + 24, angle);
    return { angle, outer, label };
  });

  const gridPolygons = Array.from({ length: levels }, (_, levelIdx) => {
    const r = (radius * (levelIdx + 1)) / levels;
    return pointsToString(
      axes.map((axis) => polarToCartesian(cx, cy, r, axis.angle))
    );
  });

  const radarPoints = axes.map((axis, idx) =>
    polarToCartesian(cx, cy, radius * (data[idx].score / levels), axis.angle)
  );

  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="section-title">Radar umiejetnosci</h2>
        <span className="pill">Skala 0-{levels}</span>
      </div>
      <p className="section-copy">Kazda os to glowna umiejetnosc. Wynik liczony jest jako opanowane podumiejetnosci / wszystkie podumiejetnosci.</p>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[430px] min-w-[420px] max-w-full">
          {gridPolygons.map((poly, idx) => (
            <polygon
              key={idx}
              points={poly}
              fill="none"
              stroke={idx === levels - 1 ? "#94a3b8" : "#cbd5e1"}
              strokeWidth={idx === levels - 1 ? 1.2 : 1}
            />
          ))}

          {axes.map((axis, idx) => (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={axis.outer.x}
              y2={axis.outer.y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}

          <polygon
            points={pointsToString(radarPoints)}
            fill="rgba(14, 165, 233, 0.24)"
            stroke="#0369a1"
            strokeWidth="2.2"
          />

          {radarPoints.map((point, idx) => (
            <circle key={data[idx].id} cx={point.x} cy={point.y} r="3.8" fill="#0369a1" />
          ))}

          <circle cx={cx} cy={cy} r="3" fill="#334155" />

          {axes.map((axis, idx) => (
            <text
              key={data[idx].id}
              x={axis.label.x}
              y={axis.label.y}
              fontSize="12"
              fill="#0f172a"
              textAnchor={labelAnchor(axis.angle)}
              dominantBaseline="middle"
            >
              {data[idx].name}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-3 grid gap-2">
        {data.map((point) => (
          <div key={point.id} className="surface-muted flex items-center justify-between px-3 py-2 text-sm">
            <span className="font-medium">{point.name}</span>
            <div className="flex items-center gap-2">
              <span className="pill">{point.done}/{point.total}</span>
              <span className="pill">{Math.round(point.ratio * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
