import type { Metadata } from "next";
import Link from "next/link";
import BarList from "@/components/BarList";
import CardVisual from "@/components/CardVisual";
import SetupNotice from "@/components/SetupNotice";
import {
  formatEUR,
  pricedOwnedCount,
  progressOf,
  topValuableCards,
  totalValue,
  valueBySet,
} from "@/lib/cards";
import { getCollectionSnapshot, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Argent" };
export const dynamic = "force-dynamic";

function cardHref(setId: string, cardCode: string): string {
  return `/carte/${encodeURIComponent(setId)}/${encodeURIComponent(cardCode)}`;
}

export default async function ArgentPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const { cards } = await getCollectionSnapshot();
  const global = progressOf(cards);
  const value = totalValue(cards);
  const priced = pricedOwnedCount(cards);
  const avg = priced === 0 ? 0 : value / priced;
  const pctPriced = global.owned === 0 ? 0 : Math.round((priced / global.owned) * 100);
  const top = topValuableCards(cards, 10);
  const bySet = valueBySet(cards);
  const mostValuable = top[0] ?? null;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Argent</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Basé sur les prix que vous renseignez vous-même, carte par carte (fiche carte ou fiche
          d&apos;un exemplaire parallèle). Aucune cote de marché automatique pour l&apos;instant.
        </p>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <p className="font-mono text-2xl font-black tabular-nums">{formatEUR(value)}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              valeur totale estimée
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-black tabular-nums">{formatEUR(avg)}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              valeur moyenne / carte valorisée
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-black tabular-nums">
              {priced}
              <span className="text-base font-medium text-zinc-400">/{global.owned}</span>
            </p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              cartes valorisées ({pctPriced}%)
            </p>
          </div>
          <div>
            <p className="truncate font-mono text-2xl font-black tabular-nums">
              {mostValuable ? formatEUR((mostValuable.price ?? 0) * Math.max(mostValuable.qty, 1)) : "—"}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              carte la plus chère
              {mostValuable ? ` · ${mostValuable.player ?? "—"}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
          Top 10 des cartes les plus chères
        </h2>
        {top.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Aucune carte valorisée pour l&apos;instant. Renseignez un prix depuis une fiche carte.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {top.map((card, index) => (
              <li
                key={`${card.set_id}-${card.card_code}-${card.parallel?.id ?? ""}`}
                className="flex items-center gap-3 bg-white px-3 py-2 dark:bg-zinc-900"
              >
                <span className="w-5 shrink-0 text-center font-mono text-xs text-zinc-400">
                  {index + 1}
                </span>
                <div className="w-9 shrink-0">
                  <CardVisual
                    player={card.player}
                    team={card.team}
                    cardCode={card.card_code}
                    rookie={card.rookie}
                    photoUrl={card.photo_url}
                    photoBackUrl={card.photo_back_url}
                    size="thumb"
                  />
                </div>
                <Link href={cardHref(card.set_id, card.card_code)} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {card.player ?? "—"}
                    {card.parallel ? (
                      <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                        {card.parallel.name}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {card.set_name} · n° <span className="font-mono">{card.card_code}</span>
                    {card.qty > 1 ? ` · ×${card.qty}` : ""}
                  </p>
                </Link>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatEUR((card.price ?? 0) * Math.max(card.qty, 1))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
          Répartition de la valeur par set
        </h2>
        <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <BarList
            items={bySet}
            format={formatEUR}
            emptyLabel="Aucune carte valorisée pour l'instant."
          />
        </div>
      </section>
    </div>
  );
}
