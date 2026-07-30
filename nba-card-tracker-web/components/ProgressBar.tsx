export interface ProgressBarProps {
  owned: number;
  total: number;
  pct?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showNumbers?: boolean;
  className?: string;
}

const HEIGHTS = { sm: "h-1.5", md: "h-2.5", lg: "h-4" } as const;

export default function ProgressBar({
  owned,
  total,
  pct,
  label,
  size = "md",
  showNumbers = true,
  className = "",
}: ProgressBarProps) {
  const percent = pct ?? (total === 0 ? 0 : Math.round((owned / total) * 100));

  return (
    <div className={className}>
      {(label || showNumbers) && (
        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          {label ? <span className="truncate font-medium">{label}</span> : <span />}
          {showNumbers ? (
            <span className="whitespace-nowrap font-mono tabular-nums">
              {owned}/{total} · {percent}%
            </span>
          ) : null}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${HEIGHTS[size]}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progression"}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
