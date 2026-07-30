export interface LinePoint {
  /** Date ISO (YYYY-MM-DD). */
  date: string;
  value: number;
}

const W = 640;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 26, left: 34 };

function labelFor(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/**
 * Courbe cumulee du nombre de cartes possedees, en SVG pur (aucune librairie).
 * Le SVG est responsive via viewBox + width 100 %.
 */
export default function LineChart({ points, title }: { points: LinePoint[]; title: string }) {
  if (points.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Pas encore de données : ajoutez des cartes pour voir la courbe démarrer.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  const ticks = [0, Math.round(max / 2), max];
  const xLabelIdx = Array.from(
    new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ).filter((i) => i >= 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`${title} : de ${points[0].value} à ${points[points.length - 1].value} cartes`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(t)}
            y2={y(t)}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <text x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.6">
            {t}
          </text>
        </g>
      ))}

      <path d={area} fill="#F97316" fillOpacity="0.15" />
      <path d={line} fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.value)} r={points.length > 40 ? 0 : 2.5} fill="#F97316" />
      ))}

      {xLabelIdx.map((i) => (
        <text
          key={`x-${i}`}
          x={x(i)}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
          fontSize="9"
          fill="currentColor"
          fillOpacity="0.6"
        >
          {labelFor(points[i].date)}
        </text>
      ))}
    </svg>
  );
}
