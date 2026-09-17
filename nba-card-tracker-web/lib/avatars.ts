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
  { seed: "goat", emoji: "🐐", label: "GOAT" },
  { seed: "crown", emoji: "👑", label: "Couronne" },
  { seed: "lightning", emoji: "⚡", label: "Éclair" },
  { seed: "target", emoji: "🎯", label: "Cible" },
  { seed: "shark", emoji: "🦈", label: "Requin" },
  { seed: "lion", emoji: "🦁", label: "Lion" },
  { seed: "eagle", emoji: "🦅", label: "Aigle" },
  { seed: "wolf", emoji: "🐺", label: "Loup" },
  { seed: "gem", emoji: "🔷", label: "Gemme" },
  { seed: "money", emoji: "💰", label: "Sac d'argent" },
  { seed: "gift", emoji: "🎁", label: "Cadeau" },
  { seed: "camera", emoji: "📸", label: "Appareil photo" },
  { seed: "comet", emoji: "☄️", label: "Comète" },
  { seed: "magnet", emoji: "🧲", label: "Aimant" },
  { seed: "clover", emoji: "🍀", label: "Trèfle" },
  { seed: "joker", emoji: "🤡", label: "Joker" },
];

const FALLBACK = AVATARS[0];

export function avatarFor(seed: string | null | undefined): AvatarOption {
  return AVATARS.find((a) => a.seed === seed) ?? FALLBACK;
}
