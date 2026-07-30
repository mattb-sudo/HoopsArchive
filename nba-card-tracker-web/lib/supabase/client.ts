"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseEnv } from "./env";

/**
 * Client Supabase cote navigateur.
 *
 * L'application fait passer toutes ses lectures et ecritures par des Server
 * Components / Server Actions : ce client n'est utile que pour les rares
 * besoins purement client (ex. lien magique, upload direct). Il est cree
 * paresseusement et renvoie `null` si les variables d'environnement sont
 * absentes, afin de ne jamais casser un rendu ni `next build`.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  const { url, anonKey } = supabaseEnv();
  cached = createBrowserClient(url, anonKey);
  return cached;
}
