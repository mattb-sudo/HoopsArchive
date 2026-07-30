/**
 * Acces centralise aux variables d'environnement Supabase.
 *
 * Important : rien ici ne lance d'erreur a l'import. `next build` doit pouvoir
 * s'executer sans projet Supabase configure — les pages verifient
 * `isSupabaseConfigured()` et affichent un ecran d'aide le cas echeant.
 */

export const SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function supabaseEnv(): { url: string; anonKey: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = supabaseEnv();
  return url.length > 0 && anonKey.length > 0;
}

export function missingSupabaseEnvKeys(): string[] {
  return SUPABASE_ENV_KEYS.filter((key) => !process.env[key]);
}
