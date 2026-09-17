export interface BarItem {
  label: string;
  value: number;
  /** Couleur de la barre (defaut : orange). */
  color?: string;
}

/** Repartition en barres horizontales, avec pourcentage optionnel. */
export default function BarList({
  items,
  showPercent = false,
  total,
  emptyLabel = "Aucune donnée.",
  format,
}: {
  items: BarItem[];
  showPercent?: boolean;
  total?: number;
  emptyLabel?: string;
  /** Formatage personnalise de la valeur affichee (ex. euros) — defaut : nombre brut. */
  format?: (value: number) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);
  const sum = total ?? items.reduce((acc, i) => acc + i.value, 0);

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const pct = sum === 0 ? 0 : Math.round((item.value / sum) * 100);
        return (
          <li key={item.label} className="text-xs">
            <div className="mb-0.5 flex items-baseline justify-between gap-2">
              <span className="truncate text-zinc-700 dark:text-zinc-200">{item.label}</span>
              <span className="whitespace-nowrap font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                {format ? format(item.value) : item.value}
                {showPercent ? ` · ${pct}%` : ""}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((item.value / max) * 100)}%`,
                  background: item.color ?? "#F97316",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
