import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardGrid from "@/components/CardGrid";
import ProgressBar from "@/components/ProgressBar";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { duplicateCount, progressOf } from "@/lib/cards";
import { getProfile, getSetView, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseStatusFilter } from "@/lib/types";

export const metadata: Metadata = { title: "Classeur" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: { setId: string };
  searchParams?: { filter?: string };
}

export default async function ClasseurPage({ params, searchParams }: PageProps) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const user = await requireUser();

  const setId = decodeURIComponent(params.setId);
  const [view, profile] = await Promise.all([getSetView(setId), getProfile(user.id)]);
  if (!view) notFound();

  const { set, subsets, cards } = view;
  const progress = progressOf(cards);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/sets"
          className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
        >
          ‹ Bibliothèque de sets
        </Link>
      </div>

      <header className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <SetCover setId={set.id} name={set.name} className="w-14 shrink-0 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{set.name}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {set.manufacturer ?? "—"} · {duplicateCount(cards)} doublon
            {duplicateCount(cards) > 1 ? "s" : ""}
          </p>
          <ProgressBar
            owned={progress.owned}
            total={progress.total}
            pct={progress.pct}
            size="md"
            className="mt-2"
          />
        </div>
      </header>

      <CardGrid
        cards={cards}
        subsets={subsets}
        groupBy="subset"
        initialStatus={parseStatusFilter(searchParams?.filter)}
        initialView={profile.prefs.defaultView}
      />
    </div>
  );
}
