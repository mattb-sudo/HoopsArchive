import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardGrid from "@/components/CardGrid";
import PageHeading from "@/components/PageHeading";
import ProgressBar from "@/components/ProgressBar";
import SetupNotice from "@/components/SetupNotice";
import { progressOf } from "@/lib/cards";
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
    <div className="space-y-5">
      <div>
        <Link
          href="/focus"
          className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
        >
          ‹ Mes focus
        </Link>
      </div>

      <header className="space-y-3">
        <PageHeading title={focus.label} />
        <ProgressBar owned={progress.owned} total={progress.total} pct={progress.pct} size="lg" />
      </header>

      <CardGrid
        cards={scoped}
        subsets={subsets}
        groupBy={groupBy}
        initialView={profile.prefs.defaultView}
        collapseByDefault={profile.prefs.collapseSectionsByDefault}
        showSetName={groupBy === "set"}
        emptyLabel="Aucune carte ne correspond à ce focus."
      />
    </div>
  );
}
