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
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Ajouter des cartes</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tapez le nom du joueur, choisissez la carte, confirmez la quantité. Le champ se vide
          aussitôt pour la suivante.
        </p>
      </header>

      <AddSession candidates={candidates} />
    </div>
  );
}
