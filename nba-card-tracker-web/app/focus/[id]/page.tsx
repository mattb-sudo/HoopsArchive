import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardGrid from "@/components/CardGrid";
import ProgressBar from "@/components/ProgressBar";
import SetupNotice from "@/components/SetupNotice";
import { progressOf } from "@/lib/cards";
import { FOCUS_TYPE_LABELS } from "@/lib/focus";
import { cardsForFocus, getCollectionSnapshot, getProfile, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Focus" };
export const dynamic = "force-dynamic";

/** Au-dela de ce nombre de cartes, on regroupe par set plutot que par sous-ensemble. */
const GROUP_BY_SET_THRESHOLD = 40;

export default async function FocusPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const user = await requireUser();

  const [{ subsets, cards, cardPlayers, focuses }, profile] = await Promise.all([
    getCollectionSnapshot(),
    getProfile(user.id),
  ]);

  const focus = focuses.find((f) => f.id === params.id);
  if (!focus) notFound();

  const scoped = cardsForFocus(focus, cards, cardPlayers);
  const progress = progressOf(scoped);
  const groupBy = scoped.length > GROUP_BY_SET_THRESHOLD ? "set" : "subset";

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/accueil"
          className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
        >
          ‹ Accueil
        </Link>
      </div>

      <header className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
          Focus · {FOCUS_TYPE_LABELS[focus.type]}
          {focus.active ? "" : " (inactif)"}
        </p>
        <h1 className="mt-0.5 text-xl font-bold">{focus.label}</h1>
        <ProgressBar
          owned={progress.owned}
          total={progress.total}
          pct={progress.pct}
          size="lg"
          className="mt-3"
        />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Les cartes signées à plusieurs joueurs sont incluses dès que ce focus concerne l&apos;un
          des signataires.
        </p>
      </header>

      <CardGrid
        cards={scoped}
        subsets={subsets}
        groupBy={groupBy}
        initialView={profile.prefs.defaultView}
        showSetName={groupBy === "set"}
        emptyLabel="Aucune carte ne correspond à ce focus."
      />
    </div>
  );
}
