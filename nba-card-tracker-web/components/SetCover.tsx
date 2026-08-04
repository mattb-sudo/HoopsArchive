import { hashSeed } from "@/lib/rng";
import { NOISE_TEXTURE } from "@/lib/textures";

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
  imageSrc,
}: {
  setId: string;
  name: string;
  className?: string;
  imageSrc?: string;
}) {
  if (imageSrc) {
    return (
      <div
        className={`relative aspect-[5/7] overflow-hidden rounded-lg shadow-card ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/20" />
      </div>
    );
  }

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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{ backgroundImage: NOISE_TEXTURE }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 22px 4px rgba(0,0,0,0.35)" }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/15" />
      <div
        className="pointer-events-none absolute inset-[3px] rounded-md border border-white/30"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
      />
      <span className="relative font-black tracking-tight text-white drop-shadow" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.45)" }}>
        {initials}
      </span>
    </div>
  );
}
