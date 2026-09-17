import type { Metadata } from "next";
import Link from "next/link";
import CardVisual from "@/components/CardVisual";
import FannedCards from "@/components/FannedCards";
import PageHeading from "@/components/PageHeading";
import ProgressBar from "@/components/ProgressBar";
import StatLine from "@/components/StatLine";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { setCoverImage } from "@/lib/setCovers";
import {
  duplicateCount,
  formatEUR,
  progressOf,
  rarestOwnedCard,
  subsetLabel,
  totalValue,
} from "@/lib/cards";
import { focusProgressList, getCollectionSnapshot, requireUser, setProgressList } from "@/lib/db";
import { dailyPick } from "@/lib/rng";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CardWithState } from "@/lib/types";

export const metadata: Metadata = { title: "Accueil" };
export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const { sets, subsets, cards, cardPlayers, focuses } = await getCollectionSnapshot();
  const global = progressOf(cards);
  const setProgress = setProgressList(sets, cards);
  const inProgress = setProgress.filter((s) => s.owned > 0);
  const shownSets = inProgress.length > 0 ? inProgress : setProgress;

  const lastAdded = cards
    .filter((card) => card.owned && card.date_added)
    .sort((a, b) => String(b.date_added).localeCompare(String(a.date_added)))
    .slice(0, 6);

  const activeFocuses = focusProgressList(
    focuses.filter((f) => f.active),
    cards,
    cardPlayers,
  );

  const dupCards = duplicateCount(cards);
  const rarest = rarestOwnedCard(cards, subsets);
  const value = totalValue(cards);
  const completedSets = setProgress.filter((s) => s.total > 0 && s.pct === 100).length;

  const stats: { label: string; value: React.ReactNode }[] = [
    {
      label: `complétion (${global.pct}%)`,
      value: (
        <>
          {global.owned}
          <span className="text-base font-medium text-zinc-400">/{global.total}</span>
        </>
      ),
    },
    { label: `doublon${dupCards > 1 ? "s" : ""}`, value: dupCards },
    { label: `set${completedSets > 1 ? "s" : ""} complété${completedSets > 1 ? "s" : ""}`, value: completedSets },
    { label: "valeur totale estimée", value: formatEUR(value) },
    {
      label: "carte la plus rare",
      value: rarest ? (
        <Link
          href={`/carte/${encodeURIComponent(rarest.set_id)}/${encodeURIComponent(rarest.card_code)}`}
          className="hover:underline"
        >
          {rarest.player ?? "—"}
        </Link>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* -------- Titre + stats -------- */}
      <section>
        <PageHeading eyebrow="Carnet de collection" title="Ma collection" />
        <div className="mt-4">
          <StatLine items={stats} />
        </div>
      </section>

      {/* -------- Sets en cours -------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
            Sets en cours
          </h2>
          <Link href="/sets" className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400">
            Tous les sets
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shownSets.map(({ set, owned, total, pct }) => (
            <Link
              key={set.id}
              href={`/classeur/${encodeURIComponent(set.id)}`}
              className="rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex gap-3">
                <SetCover
                  setId={set.id}
                  name={set.name}
                  imageSrc={setCoverImage(set.id)}
                  className="w-12 shrink-0 text-base"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{set.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{set.manufacturer ?? "—"}</p>
                </div>
              </div>
              <ProgressBar owned={owned} total={total} pct={pct} size="sm" className="mt-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* -------- Dernieres cartes ajoutees -------- */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
          Dernières cartes ajoutées
        </h2>
        <FannedCards cards={lastAdded} />
      </section>

      {/* -------- Recommandations par focus -------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
            Mes focus
          </h2>
          <Link href="/focus" className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400">
            Tous mes focus
          </Link>
        </div>

        {activeFocuses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Aucun focus actif. Ajoutez un joueur ou une équipe à suivre depuis votre{" "}
            <Link href="/focus" className="font-semibold text-orange-600 underline dark:text-orange-400">
              page focus
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {activeFocuses.map((entry) => {
              const missing = entry.cards.filter((c) => !c.owned);
              const pool: CardWithState[] = missing.length > 0 ? missing : entry.cards;
              const pick = dailyPick(pool, entry.focus.id);
              return (
                <Link
                  key={entry.focus.id}
                  href={`/focus/${entry.focus.id}`}
                  className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {pick ? (
                    <div className="w-16 shrink-0">
                      <CardVisual
                        player={pick.player}
                        team={pick.team}
                        cardCode={pick.card_code}
                        rookie={pick.rookie}
                        size="thumb"
                        dimmed={!pick.owned}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{entry.focus.label}</p>
                    {pick ? (
                      <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          Carte du jour :
                        </span>{" "}
                        {pick.player ?? "—"} · n° {pick.card_code} ·{" "}
                        {subsetLabel(pick.subset, subsets)}
                        {missing.length === 0 ? " (déjà possédée)" : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-zinc-500">Aucune carte pour ce focus.</p>
                    )}
                    <ProgressBar
                      owned={entry.owned}
                      total={entry.total}
                      pct={entry.pct}
                      size="sm"
                      className="mt-1.5"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
