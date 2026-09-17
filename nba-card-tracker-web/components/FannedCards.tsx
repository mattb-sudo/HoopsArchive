import Link from "next/link";
import CardVisual from "./CardVisual";
import { formatShortDateFr } from "@/lib/cards";
import type { CardWithState } from "@/lib/types";

/**
 * Bande de cartes en eventail : chevauchement (marges negatives, cf.
 * `.fan-strip` dans globals.css) et legere rotation alternee.
 */
export default function FannedCards({ cards }: { cards: CardWithState[] }) {
  if (cards.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Aucune carte ajoutée pour l&apos;instant. Commencez par{" "}
        <Link href="/ajouter" className="font-semibold text-orange-600 underline dark:text-orange-400">
          en ajouter une
        </Link>
        .
      </p>
    );
  }

  const middle = (cards.length - 1) / 2;

  return (
    <div className="fan-strip flex items-end pl-1 pt-3">
      {cards.map((card, index) => {
        const angle = ((index - middle) * 5).toFixed(1);
        return (
          <Link
            key={`${card.set_id}-${card.card_code}`}
            href={`/carte/${encodeURIComponent(card.set_id)}/${encodeURIComponent(card.card_code)}`}
            className="block w-[4.5rem] shrink-0 sm:w-24"
            style={{ transform: `rotate(${angle}deg)`, zIndex: index }}
            title={`${card.player ?? card.card_code} — ajoutée le ${formatShortDateFr(card.date_added)}`}
          >
            <CardVisual
              player={card.player}
              team={card.team}
              cardCode={card.card_code}
              rookie={card.rookie}
              photoUrl={card.photo_url}
              photoBackUrl={card.photo_back_url}
              size="thumb"
              gold={card.qty > 1}
            />
          </Link>
        );
      })}
    </div>
  );
}
