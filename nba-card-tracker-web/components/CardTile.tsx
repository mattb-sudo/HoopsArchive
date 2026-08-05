"use client";

import Link from "next/link";
import CardVisual from "./CardVisual";
import type { CardWithState } from "@/lib/types";

export interface CardTileProps {
  card: CardWithState;
  subsetLabel?: string | null;
  view?: "grid" | "list";
  pending?: boolean;
  onToggle: (card: CardWithState, next: boolean) => void;
  /** Affiche le nom du set (utile quand la grille melange plusieurs sets). */
  showSetName?: boolean;
}

function cardHref(card: CardWithState): string {
  return `/carte/${encodeURIComponent(card.set_id)}/${encodeURIComponent(card.card_code)}`;
}

export default function CardTile({
  card,
  subsetLabel = null,
  view = "grid",
  pending = false,
  onToggle,
  showSetName = false,
}: CardTileProps) {
  // Une tuile "parallele" represente un exemplaire coche depuis la fiche
  // carte : pas de case a cocher ici (on evite de dupliquer la gestion de
  // l'etat a deux endroits), juste un badge identifiant le parallele. Pour
  // le retirer, on retourne sur la fiche carte.
  const checkbox = card.parallel ? (
    <span
      title={card.parallel.name}
      className="max-w-full truncate rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
    >
      {card.parallel.name}
    </span>
  ) : (
    <label
      className="flex cursor-pointer items-center justify-center"
      onClick={(event) => event.stopPropagation()}
      title={card.owned ? "Retirer de la collection" : "Marquer comme possédée"}
    >
      <span className="sr-only">
        {card.owned ? "Retirer" : "Ajouter"} la carte {card.card_code}
      </span>
      <input
        type="checkbox"
        checked={card.owned}
        disabled={pending}
        onChange={(event) => onToggle(card, event.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-2 border-zinc-400 accent-orange-500 dark:border-zinc-600"
      />
    </label>
  );

  if (view === "list") {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 ${
          pending ? "opacity-60" : ""
        }`}
      >
        <div className="w-10 shrink-0">
          <CardVisual
            player={card.player}
            team={card.team}
            cardCode={card.card_code}
            rookie={card.rookie}
            size="thumb"
            dimmed={!card.owned}
            gold={card.qty > 1}
          />
        </div>
        <Link href={cardHref(card)} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {card.player ?? "—"}
            {card.rookie ? (
              <span className="ml-1.5 rounded bg-amber-400 px-1 text-[9px] font-bold text-black">
                RC
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono">{card.card_code}</span>
            {card.team ? ` · ${card.team}` : ""}
            {showSetName && card.set_name ? ` · ${card.set_name}` : ""}
          </p>
        </Link>
        {card.qty > 1 ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            ×{card.qty}
          </span>
        ) : null}
        {checkbox}
      </div>
    );
  }

  return (
    <div className={`group relative flex flex-col gap-1 ${pending ? "opacity-60" : ""}`}>
      <Link
        href={cardHref(card)}
        className="block rounded-lg transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 group-hover:-translate-y-0.5"
      >
        <CardVisual
          player={card.player}
          team={card.team}
          cardCode={card.card_code}
          rookie={card.rookie}
          subsetLabel={subsetLabel}
          size="tile"
          dimmed={!card.owned}
          gold={card.qty > 1}
        />
      </Link>

      {/*
        Ligne d'actions SOUS la vignette (pas superposee a l'image) : evite
        tout chevauchement avec le nom du joueur affiche en bas du visuel.
      */}
      <div className="flex items-center justify-between px-0.5">
        {card.qty > 1 ? (
          <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-black shadow-sm">
            ×{card.qty}
          </span>
        ) : (
          <span />
        )}
        {checkbox}
      </div>
    </div>
  );
}
