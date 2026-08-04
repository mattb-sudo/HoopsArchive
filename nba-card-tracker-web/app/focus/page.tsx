import type { Metadata } from "next";
import Link from "next/link";
import CardVisual from "@/components/CardVisual";
import SetupNotice from "@/components/SetupNotice";
import ProgressBar from "@/components/ProgressBar";
import { subsetLabel } from "@/lib/cards";
import { focusProgressList, getCollectionSnapshot, requireUser } from "@/lib/db";
import { FOCUS_TYPE_LABELS } from "@/lib/focus";
import { dailyPick } from "@/lib/rng";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOISE_TEXTURE } from "@/lib/textures";
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

  const { subsets, cards, cardPlayers, focuses } = await getCollectionSnapshot();
  const entries = focusProgressList(focuses, cards, cardPlayers);
  const active = entries.filter((e) => e.focus.active);
  const inactive = entries.filter((e) => !e.focus.active);

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
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-5 text-white shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <div className="relative flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              Ce que vous collectionnez vraiment
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight">
              Mes focus
            </h1>
          </div>
          <Link href="/profil#focus" className="shrink-0 text-xs font-semibold text-orange-400 hover:underline">
            Gérer
          </Link>
        </div>
        <p className="relative mt-1 text-sm text-white/70">
          {entries.length === 0
            ? "Aucun focus pour l'instant."
            : `${active.length} focus actif${active.length > 1 ? "s" : ""} sur ${entries.length}.`}
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Un focus suit un joueur, une équipe, ou une équipe sur une saison donnée — à travers tous
          les sets. Ajoutez-en un depuis votre{" "}
          <Link href="/profil#focus" className="font-semibold text-orange-600 underline dark:text-orange-400">
            profil
          </Link>
          .
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
