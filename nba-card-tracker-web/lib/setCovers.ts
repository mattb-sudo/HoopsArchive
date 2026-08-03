/**
 * Jaquettes reelles fournies par l'utilisateur pour certains sets (photo
 * officielle de la boite, marketing produit) placees dans public/sets/.
 * Si un set n'a pas d'entree ici, SetCover retombe sur son visuel genere.
 */
const SET_COVERS: Record<string, string> = {
  "2025-26-topps-nba-hoops": "/sets/2025-26-topps-nba-hoops.webp",
};

export function setCoverImage(setId: string): string | undefined {
  return SET_COVERS[setId];
}
