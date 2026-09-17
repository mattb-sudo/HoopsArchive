"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { avatarFor } from "@/lib/avatars";

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

/** Marque : ballon simplifie (silhouette + coutures), pas d'emoji. */
function BallMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v19M2.5 12h19M4.8 5.6c2.3 2.1 3.7 4.6 3.7 6.4s-1.4 4.3-3.7 6.4M19.2 5.6c-2.3 2.1-3.7 4.6-3.7 6.4s1.4 4.3 3.7 6.4"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Destinations de premier niveau. "Ajouter" n'en fait pas partie : c'est une
// action, pas une section a parcourir — elle a son propre traitement (bouton
// plein sur desktop, FAB surelevee au centre sur mobile). "Profil" n'en fait
// pas partie non plus : elle est rendue a part (avatar + pseudo).
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
    href: "/focus",
    label: "Focus",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      </Icon>
    ),
  },
  {
    href: "/argent",
    label: "Argent",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.5 15.5c0 1 1 1.8 2.5 1.8s2.5-.7 2.5-1.7c0-2.4-5-1.2-5-3.6 0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7" />
        <path d="M12 7.7v1M12 15.3v1" />
      </Icon>
    ),
  },
];

const ADD_ITEM: NavItem = {
  href: "/ajouter",
  label: "Ajouter",
  icon: (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/accueil") return pathname === "/accueil" || pathname === "/";
  if (href === "/sets") return pathname === "/sets" || pathname.startsWith("/classeur");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface NavBarProfile {
  pseudonym: string | null;
  avatarSeed: string | null;
}

/** Rendu commun du lien "Profil" : avatar + pseudo, a la place d'une icone generique. */
function ProfileLink({
  profile,
  active,
  variant,
}: {
  profile: NavBarProfile | null;
  active: boolean;
  variant: "desktop" | "mobile";
}) {
  const avatar = avatarFor(profile?.avatarSeed);
  const name = profile?.pseudonym || "Profil";

  if (variant === "mobile") {
    return (
      <Link
        href="/profil"
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
          active ? "text-orange-400" : "text-zinc-400"
        }`}
      >
        <span aria-hidden className="text-base leading-none">
          {avatar.emoji}
        </span>
        <span className="max-w-[4rem] truncate">{name}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/profil"
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition after:absolute after:inset-x-3 after:-bottom-[1px] after:h-0.5 after:rounded-full after:transition-colors ${
        active ? "text-white after:bg-orange-500" : "text-zinc-400 after:bg-transparent hover:text-zinc-100"
      }`}
    >
      <span aria-hidden className="text-base leading-none">
        {avatar.emoji}
      </span>
      <span className="hidden max-w-[8rem] truncate md:inline">{name}</span>
    </Link>
  );
}

/**
 * Navigation persistante : barre basse sur mobile, barre haute sur desktop.
 */
export default function NavBar({ profile = null }: { profile?: NavBarProfile | null }) {
  const pathname = usePathname() ?? "/";
  const profileActive = isActive(pathname, "/profil");

  return (
    <>
      {/*
        Chrome de navigation toujours sombre (comme les apps sportives type
        Apple Sports/NFL), independant du theme clair/sombre choisi pour le
        contenu — c'est l'identite visuelle fixe de l'appli.
      */}

      {/* -------- Desktop : barre haute -------- */}
      <header className="fixed inset-x-0 top-0 z-40 hidden border-b border-white/10 bg-zinc-950 sm:block">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-1 px-4">
          <Link href="/accueil" className="mr-4 flex items-center gap-2">
            <BallMark className="h-6 w-6 text-orange-500" />
            <span className="font-display text-lg font-semibold uppercase tracking-wide text-white">
              Hoops<span className="text-orange-500">Archive</span>
            </span>
          </Link>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition after:absolute after:inset-x-3 after:-bottom-[1px] after:h-0.5 after:rounded-full after:transition-colors ${
                isActive(pathname, item.href)
                  ? "text-white after:bg-orange-500"
                  : "text-zinc-400 after:bg-transparent hover:text-zinc-100"
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}

          <ProfileLink profile={profile} active={profileActive} variant="desktop" />

          <div className="ml-auto flex items-center gap-2">
            {/* "Ajouter" est une action, pas une section : bouton plein plutot
                qu'un onglet parmi d'autres. */}
            <Link
              href={ADD_ITEM.href}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              {ADD_ITEM.icon}
              <span className="hidden md:inline">{ADD_ITEM.label}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* -------- Mobile : mini barre haute (marque) -------- */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center border-b border-white/10 bg-zinc-950 px-4 sm:hidden">
        <Link href="/accueil" className="flex items-center gap-1.5">
          <BallMark className="h-5 w-5 text-orange-500" />
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-white">
            Hoops<span className="text-orange-500">Archive</span>
          </span>
        </Link>
      </header>

      {/* -------- Mobile : barre basse -------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <ul className="grid grid-cols-6 items-end">
          {([NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], null, NAV_ITEMS[3], "profile"] as const).map((item) => {
            if (item === "profile") {
              return (
                <li key="profile">
                  <ProfileLink profile={profile} active={profileActive} variant="mobile" />
                </li>
              );
            }
            if (!item) {
              return (
                <li key="add" className="flex items-center justify-center">
                  <Link
                    href={ADD_ITEM.href}
                    aria-label={ADD_ITEM.label}
                    className="-translate-y-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.55)] ring-4 ring-zinc-950 transition active:scale-95"
                  >
                    <Icon>
                      <path d="M12 5v14M5 12h14" />
                    </Icon>
                  </Link>
                </li>
              );
            }
            const navItem = item as NavItem;
            return (
              <li key={navItem.href}>
                <Link
                  href={navItem.href}
                  aria-current={isActive(pathname, navItem.href) ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                    isActive(pathname, navItem.href) ? "text-orange-400" : "text-zinc-400"
                  }`}
                >
                  {navItem.icon}
                  <span>{navItem.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
