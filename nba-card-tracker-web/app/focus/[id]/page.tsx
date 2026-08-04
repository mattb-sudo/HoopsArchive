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
import { NOISE_TEXTURE } from "@/lib/textures";

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

      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-4 text-white shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-widest text-orange-400">
          Focus · {FOCUS_TYPE_LABELS[focus.type]}
          {focus.active ? "" : " (inactif)"}
        </p>
        <h1 className="relative mt-0.5 font-display text-2xl font-bold uppercase tracking-tight">
          {focus.label}
        </h1>
        <ProgressBar
          owned={progress.owned}
          total={progress.total}
          pct={progress.pct}
          size="lg"
          inverted
          className="relative mt-3"
        />
        <p className="relative mt-2 text-xs text-white/60">
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
