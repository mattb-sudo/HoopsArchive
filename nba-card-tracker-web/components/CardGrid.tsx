"use client";

import { useMemo, useState, useTransition } from "react";
import CardTile from "./CardTile";
import ProgressBar from "./ProgressBar";
import { toggleOwnedAction } from "@/lib/actions";
import {
  SORT_LABELS,
  matchesQuery,
  matchesStatus,
  progressOf,
  sortCards,
  sortSubsets,
  subsetRank,
  type SortMode,
} from "@/lib/cards";
import type { CardWithState, StatusFilter, SubsetRow, ViewMode } from "@/lib/types";

export interface CardGridProps {
  cards: CardWithState[];
  subsets: SubsetRow[];
  /** Regroupement des sections : par sous-ensemble, par set, ou aucun. */
  groupBy?: "subset" | "set" | "none";
  initialStatus?: StatusFilter;
  initialView?: ViewMode;
  /** Affiche le selecteur de sous-ensemble (inutile hors classeur). */
  showSubsetFilter?: boolean;
  showFilters?: boolean;
  showSetName?: boolean;
  emptyLabel?: string;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "owned", label: "Possédées" },
  { value: "missing", label: "Manquantes" },
  { value: "duplicates", label: "Doublons" },
];

interface Section {
  key: string;
  title: string;
  rank: number;
  cards: CardWithState[];
}

/**
 * Grille (ou liste) de cartes avec barre de filtres, tri et bascule
 * "possedee" immediate. La bascule est optimiste : l'interface reagit tout de
 * suite, la server action confirme ou annule.
 */
export default function CardGrid({
  cards,
  subsets,
  groupBy = "subset",
  initialStatus = "all",
  initialView = "grid",
  showSubsetFilter = true,
  showFilters = true,
  showSetName = false,
  emptyLabel = "Aucune carte ne correspond à ces critères.",
}: CardGridProps) {
  const [overrides, setOverrides] = useState<Record<string, { owned: boolean; qty: number }>>({});
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [subsetId, setSubsetId] = useState<string>("");
  const [rookieOnly, setRookieOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("number");
  const [view, setView] = useState<ViewMode>(initialView);

  const keyOf = (card: CardWithState) => `${card.set_id} ${card.card_code}`;

  /** Cartes reelles + surcouche optimiste. */
  const effective = useMemo(
    () =>
      cards.map((card) => {
        const patch = overrides[keyOf(card)];
        return patch ? { ...card, ...patch } : card;
      }),
    [cards, overrides],
  );

  const orderedSubsets = useMemo(() => sortSubsets(subsets), [subsets]);
  const subsetById = useMemo(() => new Map(subsets.map((s) => [s.id, s])), [subsets]);

  const filtered = useMemo(() => {
    const list = effective.filter(
      (card) =>
        matchesStatus(card, status) &&
        (!rookieOnly || card.rookie) &&
        (!subsetId || card.subset === subsetId) &&
        matchesQuery(card, query),
    );
    return sortCards(list, sort);
  }, [effective, status, rookieOnly, subsetId, query, sort]);

  const sections = useMemo<Section[]>(() => {
    if (groupBy === "none") {
      return [{ key: "all", title: "", rank: 0, cards: filtered }];
    }
    const map = new Map<string, Section>();
    for (const card of filtered) {
      const key = groupBy === "set" ? (card.set_id ?? "") : (card.subset ?? "");
      if (!map.has(key)) {
        const subset = subsetById.get(key);
        map.set(key, {
          key: key || "sans",
          title:
            groupBy === "set"
              ? (card.set_name ?? key)
              : (subset?.name ?? key ?? "Sans sous-ensemble"),
          rank: groupBy === "set" ? 0 : subsetRank(key, subset?.type),
          cards: [],
        });
      }
      map.get(key)!.cards.push(card);
    }
    return Array.from(map.values()).sort(
      (a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "fr"),
    );
  }, [filtered, groupBy, subsetById]);

  function onToggle(card: CardWithState, next: boolean) {
    const key = keyOf(card);
    setError(null);
    setOverrides((prev) => ({
      ...prev,
      [key]: { owned: next, qty: next ? Math.max(card.qty, 1) : 0 },
    }));
    setPendingKeys((prev) => [...prev, key]);

    startTransition(async () => {
      const result = await toggleOwnedAction(card.set_id, card.card_code, next);
      setPendingKeys((prev) => prev.filter((k) => k !== key));
      if (!result.ok) {
        setOverrides((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
        setError(result.error ?? "Enregistrement impossible.");
      }
    });
  }

  const total = progressOf(effective);

  return (
    <div>
      {showFilters ? (
        <div className="mb-4 space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="grid-search">
              Filtrer les cartes
            </label>
            <input
              id="grid-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer (joueur, équipe, numéro…)"
              className="min-w-[10rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
            />

            {showSubsetFilter && orderedSubsets.length > 0 ? (
              <>
                <label className="sr-only" htmlFor="grid-subset">
                  Sous-ensemble
                </label>
                <select
                  id="grid-subset"
                  value={subsetId}
                  onChange={(e) => setSubsetId(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Tous les sous-ensembles</option>
                  {orderedSubsets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <label className="sr-only" htmlFor="grid-sort">
              Trier par
            </label>
            <select
              id="grid-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  Tri : {SORT_LABELS[mode]}
                </option>
              ))}
            </select>

            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {(["grid", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  className={`px-2 py-1.5 text-xs font-medium ${
                    view === mode
                      ? "bg-orange-500 text-white"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {mode === "grid" ? "Grille" : "Liste"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  aria-pressed={status === option.value}
                  className={`px-2.5 py-1.5 text-xs font-medium ${
                    status === option.value
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={rookieOnly}
                onChange={(e) => setRookieOnly(e.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              Rookies uniquement
            </label>

            <span className="ml-auto font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {filtered.length} carte{filtered.length > 1 ? "s" : ""} · {total.owned}/{total.total}{" "}
              possédées
            </span>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-7">
          {sections.map((section) => {
            const sectionProgress = progressOf(section.cards);
            return (
              <section key={section.key}>
                {section.title ? (
                  <div className="mb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                      {section.title}
                    </h2>
                    <ProgressBar
                      owned={sectionProgress.owned}
                      total={sectionProgress.total}
                      pct={sectionProgress.pct}
                      size="sm"
                      className="mt-1 max-w-xs"
                    />
                  </div>
                ) : null}

                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6"
                      : "space-y-1.5"
                  }
                >
                  {section.cards.map((card) => (
                    <CardTile
                      key={`${card.set_id}-${card.card_code}`}
                      card={card}
                      subsetLabel={
                        groupBy === "subset" ? null : (subsetById.get(card.subset ?? "")?.name ?? null)
                      }
                      view={view}
                      pending={pendingKeys.includes(keyOf(card))}
                      onToggle={onToggle}
                      showSetName={showSetName}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
