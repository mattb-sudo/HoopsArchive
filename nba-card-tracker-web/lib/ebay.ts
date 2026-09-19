/**
 * Estimation de prix automatique via l'API eBay Browse (recherche d'annonces
 * actives sur eBay.fr).
 *
 * Pourquoi eBay et pas SportsCardsPro : SportsCardsPro interdit explicitement
 * dans ses conditions d'utilisation d'exploiter ses donnees de prix depuis un
 * logiciel/une appli sans autorisation ecrite, et reserve son API a un
 * abonnement payant (49$/mois). eBay propose une vraie API gratuite (compte
 * developpeur gratuit, quota large) qui peut etre appelee automatiquement
 * depuis l'appli en respectant ses conditions d'utilisation.
 *
 * Limite a connaitre : la Browse API renvoie des annonces EN COURS (prix
 * demande par les vendeurs), pas des ventes conclues — c'est une estimation
 * indicative, pas une cote de marche basee sur des transactions reelles.
 */

const EBAY_MARKETPLACE = "EBAY_FR";

export function isEbayConfigured(): boolean {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

async function getEbayAppToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID ?? "";
  const clientSecret = process.env.EBAY_CLIENT_SECRET ?? "";
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Authentification eBay impossible (code ${res.status}).`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Authentification eBay : reponse inattendue.");
  return data.access_token;
}

export interface EbayPriceEstimate {
  price: number;
  currency: "EUR";
  sampleSize: number;
  /** Lien vers la recherche eBay correspondante, pour verifier/comparer. */
  searchUrl: string;
}

interface EbayItemSummary {
  price?: { value: string; currency: string };
}

/**
 * Cherche `query` sur eBay.fr et renvoie une estimation (mediane des prix en
 * euros trouves) — `null` si aucune annonce en euros ne correspond.
 */
export async function estimatePriceFromEbay(query: string): Promise<EbayPriceEstimate | null> {
  if (!isEbayConfigured()) {
    throw new Error("eBay n'est pas configuré (variables EBAY_CLIENT_ID / EBAY_CLIENT_SECRET manquantes).");
  }

  const token = await getEbayAppToken();
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=20`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Recherche eBay impossible (code ${res.status}).`);
  }
  const data = (await res.json()) as { itemSummaries?: EbayItemSummary[] };

  const prices = (data.itemSummaries ?? [])
    .map((item) => item.price)
    .filter((price): price is { value: string; currency: string } => Boolean(price && price.currency === "EUR"))
    .map((price) => Number(price.value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  return {
    price: Math.round(median * 100) / 100,
    currency: "EUR",
    sampleSize: prices.length,
    searchUrl: `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(query)}`,
  };
}
