"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import CardVisual from "./CardVisual";
import {
  removeParallelPhotoAction,
  setParallelNoteAction,
  setParallelPriceAction,
  setParallelQtyAction,
  toggleParallelOwnedAction,
  uploadParallelPhotoAction,
} from "@/lib/actions";
import { formatDateFr } from "@/lib/cards";
import { compressImageFile } from "@/lib/imageCompress";
import type { CardWithState, ParallelWithState } from "@/lib/types";

export interface ParallelDetailProps {
  /** Carte de base (joueur, equipe, numero...) : reference partagee, en lecture seule ici. */
  card: CardWithState;
  /** Etat + catalogue de CET exemplaire de parallele — modifiable independamment de la carte de base. */
  parallel: ParallelWithState;
  setName: string;
  subsetName: string;
}

/**
 * Fiche d'un exemplaire de parallele, independante de la fiche de la carte de
 * base : une carte normale possedee et son parallele coche partagent le joueur
 * et le numero, mais chacun a sa propre photo (recto/verso), sa propre
 * quantite et sa propre note.
 */
export default function ParallelDetail({ card, parallel, setName, subsetName }: ParallelDetailProps) {
  const [owned, setOwned] = useState(parallel.owned);
  const [qty, setQty] = useState(parallel.qty);
  const [note, setNote] = useState(parallel.note ?? "");
  const [price, setPrice] = useState(parallel.price != null ? String(parallel.price) : "");
  const [photoUrl, setPhotoUrl] = useState(parallel.photo_url ?? null);
  const [photoBackUrl, setPhotoBackUrl] = useState(parallel.photo_back_url ?? null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileBackRef = useRef<HTMLInputElement>(null);

  const cardHref = `/carte/${encodeURIComponent(card.set_id)}/${encodeURIComponent(card.card_code)}`;

  function flash(message: string) {
    setSaved(message);
    setError(null);
    setTimeout(() => setSaved(null), 2500);
  }

  function toggleOwned(next: boolean) {
    setOwned(next);
    setQty(next ? Math.max(qty, 1) : 0);
    startTransition(async () => {
      const res = await toggleParallelOwnedAction(card.set_id, card.card_code, parallel.id, next);
      if (!res.ok) {
        setOwned(!next);
        setError(res.error ?? "Enregistrement impossible.");
      } else {
        flash(next ? "Ajouté à la collection." : "Retiré de la collection.");
      }
    });
  }

  function changeQty(next: number) {
    const safe = Math.max(0, Math.min(99, next));
    setQty(safe);
    setOwned(safe > 0);
    startTransition(async () => {
      const res = await setParallelQtyAction(card.set_id, card.card_code, parallel.id, safe);
      if (!res.ok) setError(res.error ?? "Enregistrement impossible.");
      else flash("Quantité enregistrée.");
    });
  }

  async function uploadPhoto(file: File, side: "front" | "back") {
    const compressed = await compressImageFile(file);
    const formData = new FormData();
    formData.set("setId", card.set_id);
    formData.set("cardCode", card.card_code);
    formData.set("parallelId", parallel.id);
    formData.set("side", side);
    formData.set("photo", compressed);
    startTransition(async () => {
      const res = await uploadParallelPhotoAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Envoi impossible.");
      } else {
        if (side === "back") setPhotoBackUrl(res.url ?? null);
        else setPhotoUrl(res.url ?? null);
        flash(side === "back" ? "Photo du verso enregistrée." : "Photo enregistrée.");
      }
      const ref = side === "back" ? fileBackRef : fileRef;
      if (ref.current) ref.current.value = "";
    });
  }

  function removePhoto(side: "front" | "back") {
    startTransition(async () => {
      const res = await removeParallelPhotoAction(card.set_id, card.card_code, parallel.id, side);
      if (!res.ok) {
        setError(res.error ?? "Suppression impossible.");
      } else {
        if (side === "back") setPhotoBackUrl(null);
        else setPhotoUrl(null);
        flash(side === "back" ? "Photo du verso supprimée." : "Photo supprimée.");
      }
    });
  }

  function saveNote() {
    const trimmed = note.trim();
    if ((parallel.note ?? "") === trimmed) return;
    startTransition(async () => {
      const res = await setParallelNoteAction(card.set_id, card.card_code, parallel.id, trimmed);
      if (!res.ok) setError(res.error ?? "Enregistrement impossible.");
      else flash("Info enregistrée.");
    });
  }

  function savePrice() {
    const trimmed = price.trim().replace(",", ".");
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed !== null && !Number.isFinite(parsed)) {
      setError("Prix invalide.");
      return;
    }
    if ((parallel.price ?? null) === parsed) return;
    startTransition(async () => {
      const res = await setParallelPriceAction(card.set_id, card.card_code, parallel.id, parsed);
      if (!res.ok) setError(res.error ?? "Enregistrement impossible.");
      else flash("Prix enregistré.");
    });
  }

  return (
    <div className="space-y-4">
      {/* -------- Navigation -------- */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/classeur/${encodeURIComponent(card.set_id)}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ‹ Retour au classeur
        </Link>
        <Link
          href={cardHref}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Voir la carte de base
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
        {/* -------- Visuel -------- */}
        <div>
          <CardVisual
            player={card.player}
            team={card.team}
            cardCode={card.card_code}
            rookie={card.rookie}
            subsetLabel={subsetName}
            photoUrl={photoUrl}
            photoBackUrl={photoBackUrl}
            size="hero"
            dimmed={!owned}
            gold={qty > 1}
          />
          {photoUrl && photoBackUrl ? (
            <p className="mt-1.5 text-center text-[10px] leading-snug text-zinc-400">
              Survole la carte pour voir le verso.
            </p>
          ) : null}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="block cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-center text-xs font-semibold text-zinc-600 hover:border-orange-400 dark:border-zinc-700 dark:text-zinc-300">
                {photoUrl ? "Remplacer le recto" : "Ajouter le recto"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={pending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file, "front");
                  }}
                />
              </label>
              {photoUrl ? (
                <button
                  type="button"
                  onClick={() => removePhoto("front")}
                  disabled={pending}
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Supprimer le recto
                </button>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="block cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-center text-xs font-semibold text-zinc-600 hover:border-orange-400 dark:border-zinc-700 dark:text-zinc-300">
                {photoBackUrl ? "Remplacer le verso" : "Ajouter le verso"}
                <input
                  ref={fileBackRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={pending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file, "back");
                  }}
                />
              </label>
              {photoBackUrl ? (
                <button
                  type="button"
                  onClick={() => removePhoto("back")}
                  disabled={pending}
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Supprimer le verso
                </button>
              ) : null}
            </div>
          </div>
          {!photoUrl && !photoBackUrl ? (
            <p className="mt-1.5 text-center text-[10px] leading-snug text-zinc-400">
              Photo propre à cet exemplaire — n&apos;affecte pas la carte de base. Ajoute le recto
              et le verso pour que la carte se retourne au survol.
            </p>
          ) : null}
        </div>

        {/* -------- Informations -------- */}
        <div className="space-y-4">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
              Exemplaire parallèle
            </p>
            <h1 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight">
              {card.player ?? "—"}
              {card.rookie ? (
                <span className="ml-2 align-middle rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-black">
                  RC
                </span>
              ) : null}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{card.team ?? "—"}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {setName} · {subsetName} · n° <span className="font-mono">{card.card_code}</span>
              {card.season ? ` · saison ${card.season}` : ""}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {parallel.name}
              {parallel.numbered ? (
                <span className="ml-1.5 font-mono text-xs font-normal text-zinc-400">
                  #/{parallel.numbered}
                </span>
              ) : null}
              {parallel.format ? (
                <span className="ml-1.5 text-xs font-normal text-zinc-400">({parallel.format})</span>
              ) : null}
            </p>
          </header>

          {/* Possession + quantite (propres a CET exemplaire) */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={owned}
                disabled={pending}
                onChange={(e) => toggleOwned(e.target.checked)}
                className="h-5 w-5 accent-orange-500"
              />
              Je possède cet exemplaire
            </label>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Exemplaires</span>
              <div className="flex items-center overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => changeQty(qty - 1)}
                  disabled={pending || qty <= 0}
                  aria-label="Retirer un exemplaire"
                  className="px-2.5 py-1 text-sm font-bold disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-8 text-center font-mono text-sm tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => changeQty(qty + 1)}
                  disabled={pending}
                  aria-label="Ajouter un exemplaire"
                  className="px-2.5 py-1 text-sm font-bold disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <p className="w-full text-xs text-zinc-500 dark:text-zinc-400">
              Ajouté le {formatDateFr(parallel.date_added)}
              {qty > 1 ? ` · ${qty - 1} en doublon` : ""}
            </p>
          </div>

          {/* Prix propre a CET exemplaire */}
          <div>
            <label htmlFor="parallel-price" className="mb-1 block text-xs font-semibold">
              Prix / valeur estimée (€)
            </label>
            <input
              id="parallel-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={savePrice}
              inputMode="decimal"
              placeholder="Non renseigné"
              className="w-full max-w-[10rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          {/* Note propre a CET exemplaire */}
          <div>
            <label htmlFor="parallel-note" className="mb-1 block text-xs font-semibold">
              Nom / info de cet exemplaire
            </label>
            <textarea
              id="parallel-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              rows={3}
              placeholder="Ex: PSA 9, échange en cours, provenance…"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <p className="mt-1 text-[10px] text-zinc-400">
              Distinct de la note de la carte de base — propre à ce parallèle.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              {saved}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
