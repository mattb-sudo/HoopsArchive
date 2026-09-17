"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import CardVisual from "./CardVisual";
import { addCardAction } from "@/lib/actions";
import { compareCardCode } from "@/lib/cards";

/** Forme compacte envoyee au navigateur (675 cartes : quelques dizaines de Ko). */
export interface AddCandidate {
  set_id: string;
  card_code: string;
  player: string | null;
  team: string | null;
  subset: string | null;
  subset_name: string;
  set_name: string;
  rookie: boolean;
  owned: boolean;
  qty: number;
}

const MAX_SUGGESTIONS = 8;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AddSession({ candidates }: { candidates: AddCandidate[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AddCandidate | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(
    () =>
      candidates.map((card) => ({
        card,
        haystack: normalize(
          [card.player, card.team, card.card_code, card.subset_name].filter(Boolean).join(" "),
        ),
      })),
    [candidates],
  );

  const suggestions = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return index
      .filter((entry) => entry.haystack.includes(q))
      .slice(0, MAX_SUGGESTIONS * 4)
      .map((entry) => entry.card)
      .sort((a, b) => compareCardCode(a.card_code, b.card_code))
      .slice(0, MAX_SUGGESTIONS);
  }, [index, query]);

  function pick(card: AddCandidate) {
    setSelected(card);
    setQty(Math.max(1, card.qty || 1));
    setError(null);
  }

  function reset() {
    setSelected(null);
    setQty(1);
    setQuery("");
    inputRef.current?.focus();
  }

  function confirm() {
    const card = selected;
    if (!card) return;
    setError(null);

    startTransition(async () => {
      const result = await addCardAction(card.set_id, card.card_code, qty);
      if (!result.ok) {
        setError(result.error ?? "Ajout impossible.");
        return;
      }
      reset();
    });
  }

  return (
    <div className="space-y-5">
      {/* -------- Recherche -------- */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label htmlFor="add-search" className="mb-1 block text-sm font-semibold">
          Quelle carte venez-vous d&apos;ouvrir ?
        </label>
        <input
          id="add-search"
          ref={inputRef}
          type="search"
          autoFocus
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="Nom du joueur, équipe ou numéro…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
        />

        {query.trim().length >= 2 && !selected ? (
          suggestions.length > 0 ? (
            <ul className="mt-2 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {suggestions.map((card) => (
                <li key={`${card.set_id}-${card.card_code}`}>
                  <button
                    type="button"
                    onClick={() => pick(card)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-orange-50 dark:hover:bg-orange-500/10"
                  >
                    <span className="w-8 shrink-0">
                      <CardVisual
                        player={card.player}
                        team={card.team}
                        cardCode={card.card_code}
                        rookie={card.rookie}
                        size="thumb"
                        dimmed={!card.owned}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {card.player ?? "—"}
                        {card.rookie ? (
                          <span className="ml-1.5 rounded bg-amber-400 px-1 text-[9px] font-bold text-black">
                            RC
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        n° <span className="font-mono">{card.card_code}</span> · {card.subset_name}
                        {card.team ? ` · ${card.team}` : ""}
                      </span>
                    </span>
                    {card.owned ? (
                      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                        déjà ×{card.qty}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Aucune carte trouvée.</p>
          )
        ) : null}
      </div>

      {/* -------- Confirmation -------- */}
      {selected ? (
        <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-3 dark:bg-orange-950/30">
          <div className="flex items-center gap-3">
            <span className="w-14 shrink-0">
              <CardVisual
                player={selected.player}
                team={selected.team}
                cardCode={selected.card_code}
                rookie={selected.rookie}
                size="thumb"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{selected.player ?? "—"}</p>
              <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                n° <span className="font-mono">{selected.card_code}</span> · {selected.subset_name}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold">Exemplaires</span>
            <div className="flex items-center overflow-hidden rounded-lg border border-orange-300 bg-white dark:border-orange-700 dark:bg-zinc-900">
              <button
                type="button"
                aria-label="Retirer un exemplaire"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="px-3 py-1 font-bold"
              >
                −
              </button>
              <span className="w-8 text-center font-mono tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Ajouter un exemplaire"
                onClick={() => setQty((n) => Math.min(99, n + 1))}
                className="px-3 py-1 font-bold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className="ml-auto rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {pending ? "Ajout…" : "Confirmer l'ajout"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
          {error}
        </p>
      ) : null}

    </div>
  );
}
