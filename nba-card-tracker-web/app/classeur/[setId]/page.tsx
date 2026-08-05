import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardGrid from "@/components/CardGrid";
import ProgressBar from "@/components/ProgressBar";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { setCoverImage } from "@/lib/setCovers";
import { duplicateCount, progressOf } from "@/lib/cards";
import { getProfile, getSetView, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOISE_TEXTURE } from "@/lib/textures";
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

      <header className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-4 text-white shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <SetCover
          setId={set.id}
          name={set.name}
          imageSrc={setCoverImage(set.id)}
          className="relative w-16 shrink-0 text-lg ring-1 ring-white/15"
        />
        <div className="relative min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-400">
            {set.manufacturer ?? "Set"} · {duplicateCount(cards)} doublon
            {duplicateCount(cards) > 1 ? "s" : ""}
          </p>
          <h1 className="truncate font-display text-2xl font-bold uppercase tracking-tight">
            {set.name}
          </h1>
          <ProgressBar
            owned={progress.owned}
            total={progress.total}
            pct={progress.pct}
            size="lg"
            inverted
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
