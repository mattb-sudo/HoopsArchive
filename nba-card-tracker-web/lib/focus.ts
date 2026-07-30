import type { CardPlayerRow, FocusRow, FocusType } from "./types";

export const FOCUS_TYPE_LABELS: Record<FocusType, string> = {
  player: "Joueur",
  team: "Équipe",
  team_season: "Équipe + saison",
};

/** Separateur utilise pour encoder la valeur d'un focus "equipe + saison". */
export const TEAM_SEASON_SEPARATOR = "|";

export function encodeTeamSeason(teamId: string, season: string): string {
  return `${teamId}${TEAM_SEASON_SEPARATOR}${season}`;
}

export function decodeTeamSeason(value: string): { teamId: string; season: string } {
  const [teamId, season = ""] = value.split(TEAM_SEASON_SEPARATOR);
  return { teamId, season };
}

/**
 * Un focus matche une carte via la table d'association `card_players`
 * (jamais via le nom brut du joueur) :
 *   - player      -> player_id
 *   - team        -> team_id
 *   - team_season -> team_id + season
 */
export function focusMatchesPlayerRow(focus: FocusRow, row: CardPlayerRow): boolean {
  switch (focus.type) {
    case "player":
      return row.player_id === focus.value;
    case "team":
      return row.team_id === focus.value;
    case "team_season": {
      const { teamId, season } = decodeTeamSeason(focus.value);
      return row.team_id === teamId && row.season === season;
    }
    default:
      return false;
  }
}

/** Libelle par defaut propose au moment de la creation d'un focus. */
export function defaultFocusLabel(
  type: FocusType,
  displayName: string,
  season?: string | null,
): string {
  if (type === "team_season" && season) return `${displayName} ${season}`;
  return displayName;
}
