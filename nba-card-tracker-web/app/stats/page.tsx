import type { Metadata } from "next";
import Link from "next/link";
import BarList, { type BarItem } from "@/components/BarList";
import LineChart, { type LinePoint } from "@/components/LineChart";
import ProgressBar from "@/components/ProgressBar";
import SetupNotice from "@/components/SetupNotice";
import { duplicateCopies, duplicateCount, progressOf } from "@/lib/cards";
import { focusProgressList, getCollectionSnapshot, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { teamColors } from "@/lib/teamColors";
import { NOISE_TEXTURE } from "@/lib/textures";
import type { CardWithState, SubsetRow, SubsetType } from "@/lib/types";

export const metadata: Metadata = { title: "Statistiques" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<SubsetType, string> = {
  base: "Base",
  insert: "Inserts",
  autograph: "Autographes",
};

const TYPE_COLORS: Record<SubsetType, string> = {
  base: "#0EA5E9",
  insert: "#8B5CF6",
  autograph: "#F59E0B",
};

/** Courbe cumulee : une abscisse par jour ou une carte a ete ajoutee. */
function ownedTimeline(cards: CardWithState[]): LinePoint[] {
  const perDay = new Map<string, number>();
  for (const card of cards) {
    if (!card.owned || !card.date_added) continue;
    const day = card.date_added.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  let running = 0;
  return Array.from(perDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => {
      running += count;
      return { date, value: running };
    });
}

function byTeam(cards: CardWithState[]): BarItem[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!card.owned) continue;
    const team = (card.team ?? "Sans équipe").split(" / ")[0].trim();
    counts.set(team, (counts.get(team) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value, color: teamColors(label)[0] }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "fr"));
}

function bySubsetType(cards: CardWithState[], subsets: SubsetRow[]): BarItem[] {
  const typeOf = new Map(subsets.map((s) => [s.id, s.type]));
  const counts = new Map<SubsetType, number>();
  for (const card of cards) {
    if (!card.owned) continue;
    const type = typeOf.get(card.subset ?? "") ?? "base";
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return (["base", "insert", "autograph"] as SubsetType[])
    .filter((type) => (counts.get(type) ?? 0) > 0)
    .map((type) => ({
      label: TYPE_LABELS[type],
      value: counts.get(type) ?? 0,
      color: TYPE_COLORS[type],
    }));
}

export default async function StatsPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const { subsets, cards, cardPlayers, focuses } = await getCollectionSnapshot();
  const global = progressOf(cards);
  const timeline = ownedTimeline(cards);
  const teams = byTeam(cards);
  const types = bySubsetType(cards, subsets);
  const focusProgress = focusProgressList(focuses, cards, cardPlayers);

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 text-white shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-orange-400">
          Ma progression
        </p>
        <div className="relative mt-1 flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Statistiques</h1>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70 ring-1 ring-white/15">
            En évolution
          </span>
        </div>
        <p className="relative mt-1 text-sm text-white/70">
          Ces vues s&apos;enrichiront au fil des ajouts : la page est volontairement simple pour
          l&apos;instant.
        </p>
      </header>

      {/* Chiffres cles */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Cartes possédées", value: global.owned },
          { label: "Checklist", value: global.total },
          { label: "Complétion", value: `${global.pct}%` },
          { label: "Exemplaires en doublon", value: duplicateCopies(cards) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="font-mono text-2xl font-black tabular-nums">{stat.value}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Courbe d'evolution */}
      <section className="rounded-xl border border-zinc-200 bg-white p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <h2 className="mb-1 text-sm font-bold">Évolution du nombre de cartes</h2>
        <LineChart points={timeline} title="Cartes possédées au fil du temps" />
      </section>

      {/* Repartition par equipe */}
      <section className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-bold">Répartition par équipe</h2>
        <BarList items={teams} emptyLabel="Aucune carte possédée pour l'instant." />
      </section>

      {/* Repartition par type de sous-ensemble */}
      <section className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-bold">Répartition par type de carte</h2>
        <BarList
          items={types}
          showPercent
          total={global.owned}
          emptyLabel="Aucune carte possédée pour l'instant."
        />
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Doublons : {duplicateCount(cards)} carte{duplicateCount(cards) > 1 ? "s" : ""} détenue
          {duplicateCount(cards) > 1 ? "s" : ""} en plusieurs exemplaires.
        </p>
      </section>

      {/* Progression par focus */}
      <section className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-bold">Progression par focus</h2>
        {focusProgress.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aucun focus.{" "}
            <Link href="/profil" className="font-semibold text-orange-600 underline dark:text-orange-400">
              En créer un
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {focusProgress.map((entry) => (
              <Link key={entry.focus.id} href={`/focus/${entry.focus.id}`} className="block">
                <ProgressBar
                  owned={entry.owned}
                  total={entry.total}
                  pct={entry.pct}
                  label={`${entry.focus.label}${entry.focus.active ? "" : " (inactif)"}`}
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
