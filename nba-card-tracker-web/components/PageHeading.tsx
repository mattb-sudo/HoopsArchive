import SeamDivider from "./SeamDivider";

export interface PageHeadingProps {
  /** Petite annotation "manuscrite" au-dessus du titre (facultative). */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Element affiche a droite du titre (ex. logo de set) sans casser le style lettre. */
  aside?: React.ReactNode;
  className?: string;
}

/**
 * En-tete de page "carnet de collectionneur" : une annotation manuscrite,
 * un titre en grandes lettres bâton façon tableau d'affichage, et une
 * couture de ballon en guise de soulignement — a la place du bandeau sombre
 * / des rectangles generiques utilises auparavant.
 */
export default function PageHeading({ eyebrow, title, aside, className = "" }: PageHeadingProps) {
  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-0.5 -rotate-1 truncate font-hand text-lg text-orange-600 dark:text-orange-400">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-stat truncate text-[2.4rem] uppercase leading-[0.9] tracking-wide text-zinc-900 [text-shadow:1.5px_1.5px_0_rgba(0,0,0,0.08)] dark:text-zinc-50 dark:[text-shadow:1.5px_1.5px_0_rgba(0,0,0,0.35)] sm:text-5xl">
            {title}
          </h1>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <SeamDivider className="mt-1.5 text-orange-500/80" />
    </div>
  );
}
