import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ParallelDetail from "@/components/ParallelDetail";
import SetupNotice from "@/components/SetupNotice";
import { subsetLabel } from "@/lib/cards";
import { getParallelsForCard, getSetView, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Parallèle" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: { setId: string; cardId: string; parallelId: string };
}

/**
 * Fiche dediee a UN exemplaire de parallele (ex. "Rainbow Yellow #/275" de la
 * carte 12). Independante de la fiche de la carte de base : photo recto/verso,
 * quantite et note lui sont propres, cote `user_parallel_state`.
 */
export default async function ParalleleCartePage({ params }: PageProps) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const setId = decodeURIComponent(params.setId);
  const cardCode = decodeURIComponent(params.cardId);
  const parallelId = decodeURIComponent(params.parallelId);

  const [view, parallels] = await Promise.all([
    getSetView(setId),
    getParallelsForCard(setId, cardCode),
  ]);
  if (!view) notFound();

  const card = view.cards.find((c) => c.card_code === cardCode);
  if (!card) notFound();

  const parallel = parallels.find((p) => p.id === parallelId);
  if (!parallel) notFound();

  return (
    <ParallelDetail
      card={card}
      parallel={parallel}
      setName={view.set.name}
      subsetName={subsetLabel(card.subset, view.subsets)}
    />
  );
}
