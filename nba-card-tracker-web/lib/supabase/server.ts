import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseEnv } from "./env";

/**
 * Client Supabase cote serveur (React Server Components, Server Actions,
 * Route Handlers). Base sur @supabase/ssr — le pattern recommande pour
 * l'App Router (les anciens @supabase/auth-helpers-nextjs sont deprecies).
 *
 * La creation est volontairement paresseuse : appelee uniquement pendant une
 * requete, jamais a l'import d'un module. `next build` peut donc reussir sans
 * variables d'environnement ni base de donnees accessible.
 */
export function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase n'est pas configure : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { url, anonKey } = supabaseEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ecriture de cookies impossible depuis le rendu d'un Server
          // Component : c'est normal, le middleware rafraichit la session.
        }
      },
    },
  });
}
