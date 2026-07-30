/**
 * Couleurs officielles des 30 franchises NBA (primaire, secondaire).
 * Utilisees uniquement pour generer nos propres visuels de cartes : aucune
 * image, logo ou photo provenant d'un tiers n'est telechargee ou affichee.
 */
export const TEAM_COLORS: Record<string, [string, string]> = {
  "Atlanta Hawks": ["#E03A3E", "#C1D32F"],
  "Boston Celtics": ["#007A33", "#BA9653"],
  "Brooklyn Nets": ["#000000", "#FFFFFF"],
  "Charlotte Hornets": ["#1D1160", "#00788C"],
  "Chicago Bulls": ["#CE1141", "#000000"],
  "Cleveland Cavaliers": ["#860038", "#FDBB30"],
  "Dallas Mavericks": ["#00538C", "#002B5E"],
  "Denver Nuggets": ["#0E2240", "#FEC524"],
  "Detroit Pistons": ["#C8102E", "#1D42BA"],
  "Golden State Warriors": ["#1D428A", "#FFC72C"],
  "Houston Rockets": ["#CE1141", "#000000"],
  "Indiana Pacers": ["#002D62", "#FDBB30"],
  "Los Angeles Clippers": ["#C8102E", "#1D428A"],
  "Los Angeles Lakers": ["#552583", "#FDB927"],
  "Memphis Grizzlies": ["#5D76A9", "#12173F"],
  "Miami Heat": ["#98002E", "#F9A01B"],
  "Milwaukee Bucks": ["#00471B", "#EEE1C6"],
  "Minnesota Timberwolves": ["#0C2340", "#236192"],
  "New Orleans Pelicans": ["#0C2340", "#C8102E"],
  "New York Knicks": ["#006BB6", "#F58426"],
  "Oklahoma City Thunder": ["#007AC1", "#EF3B24"],
  "Orlando Magic": ["#0077C0", "#C4CED4"],
  "Philadelphia 76ers": ["#006BB6", "#ED174C"],
  "Phoenix Suns": ["#1D1160", "#E56020"],
  "Portland Trail Blazers": ["#E03A3E", "#000000"],
  "Sacramento Kings": ["#5A2D81", "#63727A"],
  "San Antonio Spurs": ["#C4CED4", "#000000"],
  "Toronto Raptors": ["#CE1141", "#000000"],
  "Utah Jazz": ["#002B5C", "#F9A01B"],
  "Washington Wizards": ["#002B5C", "#E31837"],
};

const FALLBACK_COLORS: [string, string] = ["#3F3F46", "#71717A"];

/**
 * Les cartes autographes doubles/triples portent plusieurs equipes separees
 * par " / " : on utilise la premiere pour le degrade.
 */
export function primaryTeamName(team: string | null | undefined): string {
  if (!team) return "";
  return team.split(" / ")[0].trim();
}

export function teamColors(team: string | null | undefined): [string, string] {
  const name = primaryTeamName(team);
  return TEAM_COLORS[name] ?? FALLBACK_COLORS;
}

/** Degrade CSS pret a l'emploi pour le fond d'une carte generee. */
export function teamGradient(team: string | null | undefined): string {
  const [primary, secondary] = teamColors(team);
  return `linear-gradient(150deg, ${primary} 0%, ${primary} 42%, ${secondary} 100%)`;
}

/** Luminance relative simplifiee, pour choisir un texte noir ou blanc. */
function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Couleur de texte lisible sur la couleur primaire de l'equipe. */
export function readableTextColor(team: string | null | undefined): string {
  const [primary] = teamColors(team);
  return luminance(primary) > 0.45 ? "#111111" : "#FFFFFF";
}

export const TEAM_NAMES: string[] = Object.keys(TEAM_COLORS);
