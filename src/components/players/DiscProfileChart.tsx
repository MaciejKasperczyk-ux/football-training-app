import type { DiscLetter } from "@/lib/disc";

type DiscScores = Record<DiscLetter, number>;

function dominant(scores: DiscScores) {
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "D") as DiscLetter;
}

export default function DiscProfileChart({ scores }: { scores: DiscScores }) {
  const max = 40;
  const center = 120;
  const scale = 2.4;
  const point = {
    C: { x: center - scores.C * scale, y: center - scores.C * scale },
    D: { x: center + scores.D * scale, y: center - scores.D * scale },
    S: { x: center - scores.S * scale, y: center + scores.S * scale },
    I: { x: center + scores.I * scale, y: center + scores.I * scale },
  };

  const ordered = (Object.entries(scores).sort((a, b) => b[1] - a[1]).map((x) => x[0]) as DiscLetter[]);
  const topLine = `${point[ordered[0]].x},${point[ordered[0]].y} ${point[ordered[1]].x},${point[ordered[1]].y}`;
  const lowLine = `${point[ordered[2]].x},${point[ordered[2]].y} ${point[ordered[3]].x},${point[ordered[3]].y}`;

  return (
    <div className="surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="section-title">Model DISC</h2>
        <span className="pill">Styl dominujacy: {dominant(scores)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <svg viewBox="0 0 240 240" className="h-64 w-full rounded-xl border border-slate-200 bg-white">
          <line x1="120" y1="8" x2="120" y2="232" stroke="#334155" strokeWidth="1.5" />
          <line x1="8" y1="120" x2="232" y2="120" stroke="#334155" strokeWidth="1.5" />

          <polyline points={topLine} fill="none" stroke="#ef4444" strokeWidth="2.5" />
          <polyline points={lowLine} fill="none" stroke="#2563eb" strokeWidth="2.5" />

          {(["C", "D", "S", "I"] as DiscLetter[]).map((letter) => (
            <g key={letter}>
              <circle cx={point[letter].x} cy={point[letter].y} r="4" fill="#0f172a" />
              <text x={point[letter].x + 6} y={point[letter].y - 6} fontSize="10" fill="#0f172a">
                {letter}:{scores[letter]}
              </text>
            </g>
          ))}

          <text x="16" y="20" fontSize="14" fill="#1e3a8a">C</text>
          <text x="212" y="20" fontSize="14" fill="#b91c1c">D</text>
          <text x="16" y="232" fontSize="14" fill="#14532d">S</text>
          <text x="212" y="232" fontSize="14" fill="#c2410c">I</text>
        </svg>

        <div className="grid gap-2 text-sm">
          <div className="surface-muted flex items-center justify-between px-3 py-2"><span>D</span><strong>{scores.D}</strong></div>
          <div className="surface-muted flex items-center justify-between px-3 py-2"><span>I</span><strong>{scores.I}</strong></div>
          <div className="surface-muted flex items-center justify-between px-3 py-2"><span>S</span><strong>{scores.S}</strong></div>
          <div className="surface-muted flex items-center justify-between px-3 py-2"><span>C</span><strong>{scores.C}</strong></div>
          <p className="text-xs text-slate-500">Czerwona linia laczy dwa najwyzsze wyniki, niebieska dwa najnizsze.</p>
        </div>
      </div>
    </div>
  );
}
