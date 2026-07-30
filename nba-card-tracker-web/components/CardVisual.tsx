import { readableTextColor, teamColors, teamGradient } from "@/lib/teamColors";

export type CardVisualSize = "thumb" | "tile" | "hero";

export interface CardVisualProps {
  player: string | null;
  team: string | null;
  cardCode: string;
  rookie?: boolean;
  subsetLabel?: string | null;
  /** URL signee d'une photo personnelle : remplace le visuel genere. */
  photoUrl?: string | null;
  size?: CardVisualSize;
  /** Carte manquante : rendu desature. */
  dimmed?: boolean;
  /** qty > 1 : liseré doré. */
  gold?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<CardVisualSize, { name: string; code: string; badge: string; pad: string }> =
  {
    thumb: { name: "text-[10px] leading-tight", code: "text-[8px]", badge: "text-[8px] px-1", pad: "p-1.5" },
    tile: { name: "text-xs sm:text-sm leading-tight", code: "text-[9px]", badge: "text-[9px] px-1.5", pad: "p-2" },
    hero: { name: "text-xl sm:text-2xl leading-tight", code: "text-xs", badge: "text-xs px-2 py-0.5", pad: "p-4" },
  };

/**
 * Visuel de carte 100 % genere (aucune image tierce).
 * Degrade aux couleurs de la franchise + nom du joueur + numero + badge RC.
 */
export default function CardVisual({
  player,
  team,
  cardCode,
  rookie = false,
  subsetLabel = null,
  photoUrl = null,
  size = "tile",
  dimmed = false,
  gold = false,
  className = "",
}: CardVisualProps) {
  const s = SIZE_STYLES[size];
  const [, secondary] = teamColors(team);
  const textColor = readableTextColor(team);

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-lg select-none",
        "aspect-[5/7]",
        gold ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent" : "",
        dimmed ? "grayscale-[0.85] opacity-60" : "",
        "shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={photoUrl ? undefined : { background: teamGradient(team), color: textColor }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Photo de la carte ${cardCode}${player ? ` — ${player}` : ""}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          {/* Motif decoratif : bande diagonale + halo, purement CSS */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              background: `radial-gradient(circle at 78% 18%, ${secondary} 0%, transparent 55%)`,
            }}
          />
          <div
            aria-hidden
            className="absolute -left-1/4 top-1/3 h-[140%] w-[160%] rotate-[-24deg] opacity-10"
            style={{ background: "linear-gradient(90deg, transparent, #ffffff 45%, transparent)" }}
          />
          <div aria-hidden className="absolute inset-[3px] rounded-md border border-white/25" />
        </>
      )}

      <div className={`relative flex h-full flex-col justify-between ${s.pad}`}>
        <div className="flex items-start justify-between gap-1">
          {rookie ? (
            <span
              className={`rounded bg-amber-400 font-bold uppercase tracking-wide text-black ${s.badge}`}
            >
              RC
            </span>
          ) : (
            <span />
          )}
          <span
            className={`rounded bg-black/45 font-mono tabular-nums text-white ${s.code} px-1`}
            title={`Carte n° ${cardCode}`}
          >
            {cardCode}
          </span>
        </div>

        <div className={photoUrl ? "rounded bg-black/55 px-1.5 py-1 text-white" : ""}>
          {subsetLabel && size !== "thumb" ? (
            <p className={`truncate font-medium uppercase tracking-wide opacity-80 ${s.code}`}>
              {subsetLabel}
            </p>
          ) : null}
          <p className={`font-semibold drop-shadow-sm ${s.name}`}>{player ?? "—"}</p>
          {size === "hero" && team ? (
            <p className="mt-1 text-sm opacity-85">{team}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
