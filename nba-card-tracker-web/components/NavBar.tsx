"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden {...stroke}>
      {children}
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/accueil",
    label: "Accueil",
    icon: (
      <Icon>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
      </Icon>
    ),
  },
  {
    href: "/sets",
    label: "Sets",
    icon: (
      <Icon>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <path d="M8 4v16M3.5 9.5h4.5M3.5 14.5h4.5" />
      </Icon>
    ),
  },
  {
    href: "/ajouter",
    label: "Ajouter",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M8.5 12h7" />
      </Icon>
    ),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: (
      <Icon>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
      </Icon>
    ),
  },
];

const SEARCH_ICON = (
  <Icon>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l4.5 4.5" />
  </Icon>
);

function isActive(pathname: string, href: string): boolean {
  if (href === "/accueil") return pathname === "/accueil" || pathname === "/";
  if (href === "/sets") return pathname === "/sets" || pathname.startsWith("/classeur");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navigation persistante : barre basse sur mobile, barre haute sur desktop.
 * Sur desktop l'icone de recherche deploie un champ de saisie visible.
 */
export default function NavBar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const onSearchPage = pathname === "/recherche";
  const [expanded, setExpanded] = useState(onSearchPage);
  const [query, setQuery] = useState(searchParams?.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : "/recherche");
  }

  return (
    <>
      {/* -------- Desktop : barre haute -------- */}
      <header className="fixed inset-x-0 top-0 z-40 hidden border-b border-zinc-200 bg-white/90 backdrop-blur sm:block dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-1 px-4">
          <Link href="/accueil" className="mr-3 flex items-center gap-2 font-bold">
            <span className="text-xl leading-none">🏀</span>
            <span className="hidden text-sm md:inline">NBA Card Tracker</span>
          </Link>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(pathname, item.href)
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-1">
            {expanded ? (
              <form onSubmit={submit} role="search" className="flex items-center gap-1">
                <label className="sr-only" htmlFor="nav-search">
                  Rechercher une carte
                </label>
                <input
                  id="nav-search"
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Joueur, équipe, numéro…"
                  className="w-56 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  OK
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Ouvrir la recherche"
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {SEARCH_ICON}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* -------- Mobile : barre basse -------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <ul className="grid grid-cols-5">
          {[
            NAV_ITEMS[0],
            NAV_ITEMS[1],
            { href: "/recherche", label: "Recherche", icon: SEARCH_ICON },
            NAV_ITEMS[2],
            NAV_ITEMS[3],
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive(pathname, item.href)
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
