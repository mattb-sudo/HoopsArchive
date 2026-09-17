import { readableTextColor, teamColors, teamGradient } from "@/lib/teamColors";
import { NOISE_TEXTURE } from "@/lib/textures";

export type CardVisualSize = "thumb" | "tile" | "hero";

export interface CardVisualProps {
  player: string | null;
  team: string | null;
  cardCode: string;
  rookie?: boolean;
  subsetLabel?: string | null;
  /** URL signee d'une photo personnelle (recto) : remplace le visuel genere. */
  photoUrl?: string | null;
  /**
   * URL signee de la photo du verso. Si les deux photos sont presentes, la
   * carte se retourne au survol pour reveler le verso (effet CSS pur).
   */
  photoBackUrl?: string | null;
  /** Prix/valeur saisi par l'utilisateur : petit badge en haut a gauche (tile/hero uniquement). */
  price?: number | null;
  size?: CardVisualSize;
  /** Carte manquante : rendu desature. */
  dimmed?: boolean;
  /** qty > 1 : liseré doré. */
  gold?: boolean;
  className?: string;
}

function formatBadgePrice(value: number): string {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value < 100 ? 2 : 0,
  });
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
  photoBackUrl = null,
  price = null,
  size = "tile",
  dimmed = false,
  gold = false,
  className = "",
}: CardVisualProps) {
  const s = SIZE_STYLES[size];
  const [, secondary] = teamColors(team);
  const textColor = readableTextColor(team);
  const canFlip = Boolean(photoUrl && photoBackUrl);

  const shadowClass = gold
    ? "shadow-[0_0_0_1.5px_rgba(255,255,255,.65),0_0_0_3.5px_rgba(251,191,36,.95),0_6px_16px_-2px_rgba(251,191,36,.45)]"
    : "shadow-card";

  const front = (
    <div
      className={[
        "absolute inset-0 overflow-hidden rounded-lg",
        canFlip ? "[backface-visibility:hidden]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={photoUrl ? undefined : { background: teamGradient(team), color: textColor }}
    >
      {photoUrl ? (
        <>
          <img
            src={photoUrl}
            alt={`Photo de la carte ${cardCode}${player ? ` — ${player}` : ""}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/20" />
        </>
      ) : (
        <>
          {/* Halo colore + bande diagonale, purement CSS */}
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
          {/* Grain fin pour casser l'aplat du degrade */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
            style={{ backgroundImage: NOISE_TEXTURE }}
          />
          {/* Vignette : assombrit legerement les bords pour donner du volume */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: "inset 0 0 22px 4px rgba(0,0,0,0.35)" }}
          />
          {/* Cadre : hairline exterieure + liseré interieur, comme une vraie carte */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/15" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[3px] rounded-md border border-white/30"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
          />
        </>
      )}

      <div className={`relative flex h-full flex-col justify-between ${s.pad}`}>
        <div className="flex items-start justify-between gap-1">
          {rookie ? (
            <span
              className={`rounded-full bg-amber-400 font-bold uppercase tracking-wide text-black shadow-sm ring-1 ring-black/10 ${s.badge}`}
            >
              RC
            </span>
          ) : (
            <span />
          )}
          <span
            className={`rounded-full bg-black/50 font-mono tabular-nums text-white shadow-sm ring-1 ring-white/15 backdrop-blur-[1px] ${s.badge}`}
            title={`Carte n° ${cardCode}`}
          >
            {cardCode}
          </span>
        </div>

        <div className={photoUrl ? "rounded-md bg-black/55 px-1.5 py-1 text-white shadow-sm" : ""}>
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

  return (
    <div
      className={[
        "relative w-full select-none rounded-lg",
        "aspect-[5/7]",
        canFlip ? "" : "overflow-hidden",
        "transition-shadow duration-150 group-hover:shadow-card-hover",
        dimmed ? "grayscale-[0.85] opacity-60" : "",
        shadowClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={canFlip ? { perspective: "1200px" } : undefined}
    >
      {price != null && size !== "thumb" ? (
        <span
          className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-emerald-600/95 px-1 py-0.5 text-[8px] font-bold leading-none text-white shadow-sm"
          title={`Prix renseigné : ${formatBadgePrice(price)}`}
        >
          {formatBadgePrice(price)}
        </span>
      ) : null}
      {canFlip ? (
        <div className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-500 ease-out hover:[transform:rotateY(180deg)]">
          {front}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ background: teamGradient(team), color: textColor }}
          >
            <img
              src={photoBackUrl ?? undefined}
              alt={`Verso de la carte ${cardCode}${player ? ` — ${player}` : ""}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/20" />
          </div>
        </div>
      ) : (
        front
      )}
    </div>
  );
}
