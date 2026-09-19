import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de conformite exige par eBay pour toute application ayant acces a
 * la Browse API en production : "Marketplace Account Deletion/Closure
 * Notifications". eBay verifie cet endpoint (requete GET avec un
 * `challenge_code`) avant d'activer les cles de l'application, puis y envoie
 * des notifications (POST) quand un utilisateur eBay supprime son compte.
 *
 * Cette appli ne stocke aucune donnee liee a un compte eBay (on interroge
 * uniquement des annonces publiques via la Browse API), donc il n'y a rien a
 * effacer cote base — on repond juste correctement pour rester conforme.
 *
 * A configurer sur https://developer.ebay.com (Alerts and Notifications) :
 *   - Endpoint URL : l'URL exacte de cette route une fois deployee
 *     (ex. https://mon-app.vercel.app/api/ebay-deletion-webhook)
 *   - Verification token : une chaine de 32 a 80 caracteres au choix
 * Puis renseigner les memes valeurs dans les variables d'environnement
 * Vercel EBAY_NOTIFICATION_ENDPOINT et EBAY_VERIFICATION_TOKEN.
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  const challengeCode = request.nextUrl.searchParams.get("challenge_code");
  if (!challengeCode) {
    return NextResponse.json({ error: "challenge_code manquant." }, { status: 400 });
  }

  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN ?? "";
  const endpoint = process.env.EBAY_NOTIFICATION_ENDPOINT ?? "";

  const hash = crypto.createHash("sha256");
  hash.update(challengeCode);
  hash.update(verificationToken);
  hash.update(endpoint);

  return NextResponse.json({ challengeResponse: hash.digest("hex") });
}

export async function POST(): Promise<NextResponse> {
  // Notification de suppression/fermeture de compte eBay : rien a supprimer
  // ici (aucune donnee de compte eBay conservee), on accuse juste reception.
  return new NextResponse(null, { status: 200 });
}
