"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import CardVisual from "./CardVisual";
import {
  removeCardPhotoAction,
  setQtyAction,
  toggleOwnedAction,
  updateCardDetailsAction,
  uploadCardPhotoAction,
} from "@/lib/actions";
import { formatDateFr } from "@/lib/cards";
import type { CardPlayerRow, CardWithState } from "@/lib/types";

export interface CardDetailProps {
  card: CardWithState;
  subsetName: string;
  setName: string;
  signers: CardPlayerRow[];
  photoUrl: string | null;
  prevCode: string | null;
  nextCode: string | null;
}

export default function CardDetail({
  card,
  subsetName,
  setName,
  signers,
  photoUrl,
  prevCode,
  nextCode,
}: CardDetailProps) {
  const [owned, setOwned] = useState(card.owned);
  const [qty, setQty] = useState(card.qty);
  const [jersey, setJersey] = useState(card.jersey_number ?? "");
  const [variant, setVariant] = useState(card.variant ?? "");
  const [note, setNote] = useState(card.note ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(card.note));
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const base = `/carte/${encodeURIComponent(card.set_id)}`;

  function flash(message: string) {
    setSaved(message);
    setError(null);
    setTimeout(() => setSaved(null), 2500);
  }

  function toggleOwned(next: boolean) {
    setOwned(next);
    setQty(next ? Math.max(qty, 1) : 0);
    startTransition(async () => {
      const res = await toggleOwnedAction(card.set_id, card.card_code, next);
      if (!res.ok) {
        setOwned(!next);
        setError(res.error ?? "Enregistrement impossible.");
      } else {
        flash(next ? "Ajoutée à la collection." : "Retirée de la collection.");
      }
    });
  }

  function changeQty(next: number) {
    const safe = Math.max(0, Math.min(99, next));
    setQty(safe);
    setOwned(safe > 0);
    startTransition(async () => {
      const res = await setQtyAction(card.set_id, card.card_code, safe);
      if (!res.ok) setError(res.error ?? "Enregistrement impossible.");
      else flash("Quantité enregistrée.");
    });
  }

  function saveDetails(fields: { note?: string; variant?: string; jersey_number?: string }) {
    startTransition(async () => {
      const res = await updateCardDetailsAction(card.set_id, card.card_code, fields);
      if (!res.ok) setError(res.error ?? "Enregistrement impossible.");
      else flash("Enregistré.");
    });
  }

  function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.set("setId", card.set_id);
    formData.set("cardCode", card.card_code);
    formData.set("photo", file);
    startTransition(async () => {
      const res = await uploadCardPhotoAction(formData);
      if (!res.ok) setError(res.error ?? "Envoi impossible.");
      else flash("Photo enregistrée.");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function removePhoto() {
    startTransition(async () => {
      const res = await removeCardPhotoAction(card.set_id, card.card_code);
      if (!res.ok) setError(res.error ?? "Suppression impossible.");
      else flash("Photo supprimée.");
    });
  }

  return (
    <div className="space-y-4">
      {/* -------- Navigation -------- */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/classeur/${encodeURIComponent(card.set_id)}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ‹ Retour au classeur
        </Link>
        <div className="flex gap-1.5">
          {prevCode ? (
            <Link
              href={`${base}/${encodeURIComponent(prevCode)}`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ‹ Précédente
            </Link>
          ) : null}
          {nextCode ? (
            <Link
              href={`${base}/${encodeURIComponent(nextCode)}`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Suivante ›
            </Link>
          ) : null}
        </div>
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
            size="hero"
            dimmed={!owned}
            gold={qty > 1}
          />

          <div className="mt-2 space-y-1.5">
            <label
              className="block cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-center text-xs font-semibold text-zinc-600 hover:border-orange-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              {photoUrl ? "Remplacer ma photo" : "Ajouter ma photo de la carte"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={pending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                }}
              />
            </label>
            {photoUrl ? (
              <button
                type="button"
                onClick={removePhoto}
                disabled={pending}
                className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Supprimer ma photo
              </button>
            ) : (
              <p className="text-center text-[10px] leading-snug text-zinc-400">
                Sans photo, le visuel est généré aux couleurs de l&apos;équipe.
              </p>
            )}
          </div>
        </div>

        {/* -------- Informations -------- */}
        <div className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold leading-tight">
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
          </header>

          {signers.length > 1 ? (
            <div className="rounded-lg bg-zinc-100 p-2.5 text-xs dark:bg-zinc-800">
              <p className="font-semibold">Carte à plusieurs signataires</p>
              <ul className="mt-1 space-y-0.5">
                {signers.map((s) => (
                  <li key={s.slot}>
                    {s.player}
                    {s.team ? ` — ${s.team}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Possession + quantite */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={owned}
                disabled={pending}
                onChange={(e) => toggleOwned(e.target.checked)}
                className="h-5 w-5 accent-orange-500"
              />
              Je la possède
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
              Ajoutée le {formatDateFr(card.date_added)}
              {qty > 1 ? ` · ${qty - 1} en doublon` : ""}
            </p>
          </div>

          {/* Champs editables */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="jersey" className="mb-1 block text-xs font-semibold">
                Numéro de maillot
              </label>
              <input
                id="jersey"
                value={jersey}
                onChange={(e) => setJersey(e.target.value)}
                onBlur={() => {
                  if ((card.jersey_number ?? "") !== jersey) saveDetails({ jersey_number: jersey });
                }}
                placeholder="Non renseigné"
                inputMode="numeric"
                maxLength={3}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <p className="mt-1 text-[10px] text-zinc-400">
                Vide par défaut : à compléter d&apos;après la carte que vous avez en main.
              </p>
            </div>

            <div>
              <label htmlFor="variant" className="mb-1 block text-xs font-semibold">
                Variante / parallèle
              </label>
              <input
                id="variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                onBlur={() => {
                  if ((card.variant ?? "") !== variant) saveDetails({ variant });
                }}
                placeholder="Base, Gold, Purple…"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* Note repliable */}
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setNoteOpen((open) => !open)}
              aria-expanded={noteOpen}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold"
            >
              <span>Note personnelle{note && !noteOpen ? " ·" : ""}</span>
              <span aria-hidden className="text-zinc-400">
                {noteOpen ? "▴" : "▾"}
              </span>
            </button>
            {noteOpen ? (
              <div className="px-3 pb-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => {
                    if ((card.note ?? "") !== note) saveDetails({ note });
                  }}
                  rows={3}
                  placeholder="État, provenance, échange en cours…"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
            ) : null}
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
