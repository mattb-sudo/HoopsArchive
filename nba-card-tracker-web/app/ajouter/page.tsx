import type { Metadata } from "next";
import AddSession, { type AddCandidate } from "@/components/AddSession";
import SetupNotice from "@/components/SetupNotice";
import { subsetLabel } from "@/lib/cards";
import { getCollectionSnapshot, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Ajouter des cartes" };
export const dynamic = "force-dynamic";

export default async function AjouterPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const { cards, subsets } = await getCollectionSnapshot();

  const candidates: AddCandidate[] = cards.map((card) => ({
    set_id: card.set_id,
    card_code: card.card_code,
    player: card.player,
    team: card.team,
    subset: card.subset,
    subset_name: subsetLabel(card.subset, subsets),
    set_name: card.set_name ?? "",
    rookie: card.rookie,
    owned: card.owned,
    qty: card.qty,
  }));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Ajouter une carte</h1>

      <AddSession candidates={candidates} />
    </div>
  );
}
