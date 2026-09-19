/**
 * Aide a la recherche de prix sur SportsCardsPro, sans integration API (leur
 * API est reservee a un abonnement payant a 49$/mois). On construit juste une
 * URL de recherche pre-remplie que l'utilisateur ouvre dans un nouvel onglet
 * pour lire le prix et le reporter lui-meme dans le champ prix de la carte.
 */

/** Construit la requete texte a partir des infos de la carte (et, le cas echeant, du parallele). */
export function scpQueryForCard(
  player: string | null,
  cardCode: string,
  setName: string,
  parallelName?: string | null,
): string {
  return [player ?? "", `#${cardCode}`, setName, parallelName ?? ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** URL de recherche SportsCardsPro (page "prix"), a ouvrir dans un nouvel onglet. */
export function scpSearchUrl(query: string): string {
  const q = query.replace(/\s+/g, " ").trim();
  return `https://www.sportscardspro.com/search-products?q=${encodeURIComponent(q)}&type=prices`;
}

/**
 * Lien vers 130point.com (ventes eBay terminees). Le site est protege par une
 * verification anti-bot (Cloudflare) qui a empeche de confirmer le parametre
 * exact de recherche pre-remplie : on renvoie donc la page de recherche brute
 * — le nom de la carte reste a saisir a la main une fois la page ouverte.
 */
export function point130SearchUrl(): string {
  return "https://130point.com/sales/";
}
