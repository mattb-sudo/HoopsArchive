/**
 * Tirage pseudo-aleatoire deterministe.
 *
 * Utilise pour la "carte du jour" de chaque focus : la selection doit etre
 * stable toute la journee et changer a minuit. On seme donc le generateur avec
 * la date du jour + l'identifiant du focus, sans stocker quoi que ce soit.
 */

/** Hash 32 bits (variante de xmur3) pour transformer une chaine en graine. */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** PRNG mulberry32 : rapide, deterministe, suffisant pour un tirage cosmetique. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Date locale au format YYYY-MM-DD, utilisee comme graine journaliere. */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Choisit un element de facon deterministe a partir d'une graine textuelle.
 * Retourne null si la liste est vide.
 */
export function seededPick<T>(items: readonly T[], seed: string): T | null {
  if (items.length === 0) return null;
  const rand = mulberry32(hashSeed(seed));
  const index = Math.floor(rand() * items.length) % items.length;
  return items[index];
}

/** Carte du jour : graine = date du jour + identifiant du focus. */
export function dailyPick<T>(items: readonly T[], focusId: string, date?: Date): T | null {
  return seededPick(items, `${todayKey(date)}::${focusId}`);
}
