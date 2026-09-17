import type { Metadata } from "next";
import Link from "next/link";
import CardVisual from "@/components/CardVisual";
import FocusManager from "@/components/FocusManager";
import ProgressBar from "@/components/ProgressBar";
import SetupNotice from "@/components/SetupNotice";
import { subsetLabel } from "@/lib/cards";
import { focusProgressList, getCollectionSnapshot, getFocusOptions, requireUser } from "@/lib/db";
import { FOCUS_TYPE_LABELS } from "@/lib/focus";
import { dailyPick } from "@/lib/rng";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CardWithState } from "@/lib/types";

export const metadata: Metadata = { title: "Mes focus" };
export const dynamic = "force-dynamic";

/**
 * Bibliotheque des focus : symetrique de la bibliotheque de sets (/sets),
 * mais pour la vraie unite de collection des utilisateurs — un joueur, une
 * equipe, une equipe+saison — plutot que le set entier.
 */
export default async function FocusLibraryPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const [{ subsets, cards, cardPlayers, focuses }, options] = await Promise.all([
    getCollectionSnapshot(),
    getFocusOptions(),
  ]);
  const entries = focusProgressList(focuses, cards, cardPlayers);
  const active = entries.filter((e) => e.focus.active);
  const inactive = entries.filter((e) => !e.focus.active);
  const focusProgress = Object.fromEntries(
    entries.map((entry) => [entry.focus.id, { owned: entry.owned, total: entry.total, pct: entry.pct }]),
  );

  function Row({ entry }: { entry: (typeof entries)[number] }) {
    const missing = entry.cards.filter((c) => !c.owned);
    const pool: CardWithState[] = missing.length > 0 ? missing : entry.cards;
    const pick = dailyPick(pool, entry.focus.id);

    return (
      <Link
        href={`/focus/${entry.focus.id}`}
        className={`flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900 ${
          entry.focus.active ? "" : "opacity-60"
        }`}
      >
        {pick ? (
          <div className="w-14 shrink-0">
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
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            {FOCUS_TYPE_LABELS[entry.focus.type]}
            {entry.focus.active ? "" : " · inactif"}
          </p>
          <p className="truncate font-semibold">{entry.focus.label}</p>
          {pick ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              Carte du jour : {pick.player ?? "—"} · n° {pick.card_code} ·{" "}
              {subsetLabel(pick.subset, subsets)}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Aucune carte pour ce focus.
            </p>
          )}
          <ProgressBar owned={entry.owned} total={entry.total} pct={entry.pct} size="sm" className="mt-2" />
        </div>
        <span aria-hidden className="text-zinc-400">
          ›
        </span>
      </Link>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Mes focus</h1>

      <FocusManager focuses={focuses} options={options} focusProgress={focusProgress} />

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Un focus suit un joueur, une équipe, ou une équipe sur une saison donnée — à travers tous
          les sets. Ajoutez-en un ci-dessus.
        </p>
      ) : (
        <div className="space-y-3">
          {active.map((entry) => (
            <Row key={entry.focus.id} entry={entry} />
          ))}
          {inactive.length > 0 ? (
            <div className="space-y-3 pt-2">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Focus inactifs
              </h2>
              {inactive.map((entry) => (
                <Row key={entry.focus.id} entry={entry} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
