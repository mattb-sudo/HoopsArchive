import { Suspense } from "react";
import { Oswald, Bebas_Neue, Caveat } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { getCurrentUser, tryGetProfile } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Theme } from "@/lib/types";

// Police condensee/grasse pour les titres et l'identite ("HOOPS ARCHIVE"),
// dans l'esprit des habillages TV sportifs plutot qu'une police par defaut.
const displayFont = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

// Police "tableau d'affichage" pour les titres et les chiffres de stats —
// remplace le rendu générique par quelque chose qui évoque un vrai
// panneau de score / dos de carte plutôt qu'un dashboard.
const statFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-stat",
});

// Touche manuscrite pour les petites annotations façon carnet de
// collectionneur (au-dessus des titres, sous les stats).
const handFont = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: { default: "Hoops Archive", template: "%s · Hoops Archive" },
  description:
    "Suivi personnel d'une collection de cartes de basket : classeurs, focus joueurs et équipes, statistiques.",
  applicationName: "Hoops Archive",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Toute l'application depend de la session (cookies) : aucun pre-rendu statique.
// Cela garantit aussi que `next build` n'essaie pas de contacter Supabase.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let theme: Theme = "light";
  let signedIn = false;
  let navProfile: { pseudonym: string | null; avatarSeed: string | null } | null = null;

  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        signedIn = true;
        const profile = await tryGetProfile(user.id);
        theme = profile?.prefs.theme ?? "light";
        if (profile) navProfile = { pseudonym: profile.pseudonym, avatarSeed: profile.avatar_seed };
      }
    } catch {
      // Projet Supabase injoignable : on rend quand meme la coquille.
    }
  }

  return (
    <html
      lang="fr"
      className={`${displayFont.variable} ${statFont.variable} ${handFont.variable}${theme === "dark" ? " dark" : ""}`}
    >
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {signedIn ? (
          <Suspense fallback={null}>
            <NavBar profile={navProfile} />
          </Suspense>
        ) : null}
        <main
          className={
            signedIn
              ? "mx-auto w-full max-w-5xl px-4 pb-24 pt-16 sm:pb-10 sm:pt-20"
              : "mx-auto w-full max-w-5xl px-4 py-10"
          }
        >
          {children}
        </main>
      </body>
    </html>
  );
}
