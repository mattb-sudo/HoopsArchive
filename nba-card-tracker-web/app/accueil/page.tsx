import type { Metadata } from "next";
import Link from "next/link";
import CardVisual from "@/components/CardVisual";
import FannedCards from "@/components/FannedCards";
import ProgressBar from "@/components/ProgressBar";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { duplicateCopies, duplicateCount, progressOf, subsetLabel } from "@/lib/cards";
import {
  focusProgressList,
  getCollectionSnapshot,
  requireUser,
  setProgressList,
} from "@/lib/db";
import { dailyPick } from "@/lib/rng";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CardWithState } from "@/lib/types";

export const metadata: Metadata = { title: "Accueil" };
export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/recherche", label: "Recherche", hint: "Trouver une carte" },
  { href: "/ajouter", label: "Ajouter", hint: "Session d'ajout rapide" },
  { href: "/stats", label: "Statistiques", hint: "Suivre l'évolution" },
];

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
  const dupCopies = duplicateCopies(cards);
  const dupSetId =
    setProgress
      .map((s) => ({ id: s.set.id, n: duplicateCount(cards.filter((c) => c.set_id === s.set.id)) }))
      .sort((a, b) => b.n - a.n)[0]?.id ?? sets[0]?.id;

  return (
    <div className="space-y-8">
      {/* -------- Banniere globale -------- */}
      <section className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-5 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Ma collection</p>
        <p className="mt-1 font-mono text-4xl font-black tabular-nums">
          {global.owned}
          <span className="text-2xl font-bold opacity-80">/{global.total}</span>
        </p>
        <p className="text-sm opacity-90">{global.pct}% de la checklist</p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${global.pct}%` }}
          />
        </div>
      </section>

      {/* -------- Sets en cours -------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-base font-bold">Sets en cours</h2>
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
                <SetCover setId={set.id} name={set.name} className="w-12 shrink-0 text-base" />
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
        <h2 className="text-base font-bold">Dernières cartes ajoutées</h2>
        <FannedCards cards={lastAdded} />
      </section>

      {/* -------- Recommandations par focus -------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-base font-bold">Mes focus</h2>
          <Link href="/profil" className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400">
            Gérer
          </Link>
        </div>

        {activeFocuses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Aucun focus actif. Ajoutez un joueur ou une équipe à suivre depuis votre{" "}
            <Link href="/profil" className="font-semibold text-orange-600 underline dark:text-orange-400">
              profil
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

      {/* -------- Doublons + acces rapides -------- */}
      <section className="grid gap-3 sm:grid-cols-2">
        {dupSetId ? (
          <Link
            href={`/classeur/${encodeURIComponent(dupSetId)}?filter=duplicates`}
            className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 transition hover:border-amber-500 dark:border-amber-700 dark:bg-amber-950/40"
          >
            <span className="text-2xl">🔁</span>
            <div>
              <p className="font-mono text-2xl font-black tabular-nums text-amber-800 dark:text-amber-200">
                {dupCards}
              </p>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                carte{dupCards > 1 ? "s" : ""} en doublon · {dupCopies} exemplaire
                {dupCopies > 1 ? "s" : ""} disponible{dupCopies > 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col justify-center rounded-xl border border-zinc-200 bg-white p-3 text-center transition hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-sm font-semibold">{link.label}</span>
              <span className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{link.hint}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
