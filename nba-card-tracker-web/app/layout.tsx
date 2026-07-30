import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { getCurrentUser, tryGetProfile } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Theme } from "@/lib/types";

export const metadata: Metadata = {
  title: { default: "NBA Card Tracker", template: "%s · NBA Card Tracker" },
  description:
    "Suivi personnel d'une collection de cartes de basket : classeurs, focus joueurs et équipes, statistiques.",
  applicationName: "NBA Card Tracker",
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

  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        signedIn = true;
        const profile = await tryGetProfile(user.id);
        theme = profile?.prefs.theme ?? "light";
      }
    } catch {
      // Projet Supabase injoignable : on rend quand meme la coquille.
    }
  }

  return (
    <html lang="fr" className={theme === "dark" ? "dark" : undefined}>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {signedIn ? (
          <Suspense fallback={null}>
            <NavBar />
          </Suspense>
        ) : null}
        <main
          className={
            signedIn
              ? "mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:pb-10 sm:pt-20"
              : "mx-auto w-full max-w-5xl px-4 py-10"
          }
        >
          {children}
        </main>
      </body>
    </html>
  );
}
