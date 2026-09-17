import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardGrid from "@/components/CardGrid";
import PageHeading from "@/components/PageHeading";
import ProgressBar from "@/components/ProgressBar";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { setCoverImage } from "@/lib/setCovers";
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

  const { set, subsets, displayCards: cards } = view;
  const progress = progressOf(cards);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/sets"
          className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
        >
          ‹ Bibliothèque de sets
        </Link>
      </div>

      <header className="space-y-3">
        <PageHeading
          eyebrow={
            <>
              {set.manufacturer ?? "Set"} · {duplicateCount(cards)} doublon
              {duplicateCount(cards) > 1 ? "s" : ""}
            </>
          }
          title={set.name}
          aside={
            <SetCover
              setId={set.id}
              name={set.name}
              imageSrc={setCoverImage(set.id)}
              className="w-14 text-base ring-1 ring-black/5 dark:ring-white/10"
            />
          }
        />
        <ProgressBar owned={progress.owned} total={progress.total} pct={progress.pct} size="lg" />
      </header>

      <CardGrid
        cards={cards}
        subsets={subsets}
        groupBy="subset"
        initialStatus={parseStatusFilter(searchParams?.filter)}
        initialView={profile.prefs.defaultView}
        collapseByDefault={profile.prefs.collapseSectionsByDefault}
      />
    </div>
  );
}
