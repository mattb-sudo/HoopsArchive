import { hashSeed } from "@/lib/rng";

const PALETTES: [string, string][] = [
  ["#F97316", "#FBBF24"],
  ["#7C3AED", "#EC4899"],
  ["#0EA5E9", "#22D3EE"],
  ["#16A34A", "#84CC16"],
  ["#DC2626", "#F59E0B"],
];

/**
 * Jaquette de set generee : degrade deterministe (derive de l'identifiant) et
 * initiales. Aucune image tierce n'est utilisee.
 */
export default function SetCover({
  setId,
  name,
  className = "",
}: {
  setId: string;
  name: string;
  className?: string;
}) {
  const [from, to] = PALETTES[hashSeed(setId) % PALETTES.length];
  const initials = name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={`relative flex aspect-[5/7] items-center justify-center overflow-hidden rounded-lg shadow-card ${className}`}
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
      aria-hidden
    >
      <div
        className="absolute -left-1/3 top-1/4 h-[150%] w-[170%] rotate-[-25deg] opacity-20"
        style={{ background: "linear-gradient(90deg, transparent, #fff 50%, transparent)" }}
      />
      <div className="absolute inset-[3px] rounded-md border border-white/30" />
      <span className="relative font-black tracking-tight text-white drop-shadow">{initials}</span>
    </div>
  );
}
