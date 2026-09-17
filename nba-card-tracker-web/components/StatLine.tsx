export interface StatLineItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

/**
 * Ligne de stats façon "box-score" au dos d'une carte : des chiffres qui
 * respirent, separes par de fins traits verticaux, une legende manuscrite
 * en dessous. Volontairement sans encadres ni pastilles — l'idee est que
 * ce soit lisible comme une fiche de stats, pas comme un dashboard.
 */
export default function StatLine({ items }: { items: StatLineItem[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-x-7 gap-y-5 sm:gap-x-9">
      {items.map((item, index) => (
        <div key={index} className="relative min-w-0 pl-7 first:pl-0">
          {index > 0 ? (
            <span
              aria-hidden
              className="absolute left-0 top-0.5 hidden h-[2.4rem] w-px bg-zinc-300 dark:bg-zinc-700 sm:block"
            />
          ) : null}
          <p className="font-stat truncate text-3xl leading-none tracking-wide text-zinc-900 [text-shadow:1px_1px_0_rgba(0,0,0,0.06)] dark:text-zinc-50 sm:text-4xl">
            {item.value}
          </p>
          <p className="mt-1.5 truncate font-hand text-lg leading-none text-orange-700/90 dark:text-orange-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
