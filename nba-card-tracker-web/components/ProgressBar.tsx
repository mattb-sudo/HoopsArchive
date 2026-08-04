export interface ProgressBarProps {
  owned: number;
  total: number;
  pct?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showNumbers?: boolean;
  /** Rendu sur un fond sombre fixe (bandeau de marque), independant du theme. */
  inverted?: boolean;
  className?: string;
}

const HEIGHTS = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" } as const;
const NUMBER_TEXT = {
  sm: "text-xs font-mono tabular-nums",
  md: "text-xs font-mono tabular-nums",
  lg: "font-display text-base font-semibold tabular-nums tracking-tight",
} as const;

export default function ProgressBar({
  owned,
  total,
  pct,
  label,
  size = "md",
  showNumbers = true,
  inverted = false,
  className = "",
}: ProgressBarProps) {
  const percent = pct ?? (total === 0 ? 0 : Math.round((owned / total) * 100));
  const textTone = inverted
    ? "text-white/70"
    : "text-zinc-600 dark:text-zinc-400";
  const trackTone = inverted
    ? "bg-white/15"
    : "bg-zinc-200 dark:bg-zinc-800";

  return (
    <div className={className}>
      {(label || showNumbers) && (
        <div className={`mb-1 flex items-baseline justify-between gap-2 ${textTone}`}>
          {label ? <span className="truncate text-xs font-medium">{label}</span> : <span />}
          {showNumbers ? (
            <span className={`whitespace-nowrap ${NUMBER_TEXT[size]} ${inverted ? "text-white" : ""}`}>
              {owned}/{total}
              <span className={inverted ? "text-white/60" : "opacity-70"}> · {percent}%</span>
            </span>
          ) : null}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full ${trackTone} ${HEIGHTS[size]}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progression"}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            inverted ? "bg-orange-500" : "bg-gradient-to-r from-orange-500 to-amber-400"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
