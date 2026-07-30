import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CardDetail from "@/components/CardDetail";
import SetupNotice from "@/components/SetupNotice";
import { subsetLabel } from "@/lib/cards";
import {
  getCardPlayersForCard,
  getSetView,
  getSignedPhotoUrl,
  requireUser,
} from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Carte" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: { setId: string; cardId: string };
}

export default async function CartePage({ params }: PageProps) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const setId = decodeURIComponent(params.setId);
  const cardCode = decodeURIComponent(params.cardId);

  const view = await getSetView(setId);
  if (!view) notFound();

  // `view.cards` est deja trie par numero : l'index donne precedent / suivant.
  const index = view.cards.findIndex((c) => c.card_code === cardCode);
  if (index < 0) notFound();

  const card = view.cards[index];
  const [signers, photoUrl] = await Promise.all([
    getCardPlayersForCard(setId, cardCode),
    getSignedPhotoUrl(card.photo_path),
  ]);

  return (
    <CardDetail
      card={card}
      setName={view.set.name}
      subsetName={subsetLabel(card.subset, view.subsets)}
      signers={signers}
      photoUrl={photoUrl}
      prevCode={index > 0 ? view.cards[index - 1].card_code : null}
      nextCode={index < view.cards.length - 1 ? view.cards[index + 1].card_code : null}
    />
  );
}
