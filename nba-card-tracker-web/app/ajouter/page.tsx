import type { Metadata } from "next";
import AddSession, { type AddCandidate } from "@/components/AddSession";
import SetupNotice from "@/components/SetupNotice";
import { subsetLabel } from "@/lib/cards";
import { getCollectionSnapshot, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOISE_TEXTURE } from "@/lib/textures";

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
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-5 text-white shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-orange-400">
          Session d&apos;ajout
        </p>
        <h1 className="relative mt-1 font-display text-2xl font-bold uppercase tracking-tight">
          Ajouter des cartes
        </h1>
        <p className="relative mt-1 text-sm text-white/70">
          Tapez le nom du joueur, choisissez la carte, confirmez la quantité. Le champ se vide
          aussitôt pour la suivante.
        </p>
      </header>

      <AddSession candidates={candidates} />
    </div>
  );
}
