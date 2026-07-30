/**
 * Avatars disponibles sur le profil. On stocke uniquement la graine
 * (`profiles.avatar_seed`) : aucun fichier image n'est necessaire.
 */
export interface AvatarOption {
  seed: string;
  emoji: string;
  label: string;
}

export const AVATARS: AvatarOption[] = [
  { seed: "basketball", emoji: "🏀", label: "Ballon" },
  { seed: "hoop", emoji: "🥇", label: "Médaille" },
  { seed: "star", emoji: "⭐", label: "Étoile" },
  { seed: "fire", emoji: "🔥", label: "Feu" },
  { seed: "rocket", emoji: "🚀", label: "Fusée" },
  { seed: "diamond", emoji: "💎", label: "Diamant" },
  { seed: "cards", emoji: "🃏", label: "Cartes" },
  { seed: "trophy", emoji: "🏆", label: "Trophée" },
];

const FALLBACK = AVATARS[0];

export function avatarFor(seed: string | null | undefined): AvatarOption {
  return AVATARS.find((a) => a.seed === seed) ?? FALLBACK;
}
