import { mapGqlGameToCfbdGame, type GqlGameNode } from './graphql/map-to-cfbd';
import { reshapeCfbdGames, type VenueRecord } from '../reshape-games';
import type { GameLean, TeamLean, ReshapedTeam } from '../types';
import type { GamesResponse, TeamMetadata } from '@/app/store/api';

export const isBroadcastableGame = (game: {
  conferenceGame?: boolean | null;
  notes?: string | null;
}): boolean => game.conferenceGame === true && !game.notes?.toLowerCase().includes('championship');

export const toTeamMetadata = (teams: ReshapedTeam[]): TeamMetadata[] =>
  teams.map((team) => ({
    id: team._id,
    abbrev: team.abbreviation,
    name: team.name,
    displayName: team.displayName,
    shortDisplayName: team.shortDisplayName,
    mascot: team.mascot,
    alternateNames: team.alternateNames,
    logo: team.logo,
    color: team.color,
    alternateColor: team.alternateColor,
    conferenceId: team.conference,
    conferenceStanding: team.conferenceStanding,
    conferenceRecord: team.record.conference,
    record: team.record,
    rank: null,
    division: team.division,
  })) as unknown as TeamMetadata[];

export const buildSubscriptionPayload = (
  nodes: GqlGameNode[],
  teams: ReshapedTeam[],
  venueMap: Map<number, VenueRecord>,
  season: number
): GamesResponse => {
  const teamMap = new Map<string, TeamLean>(
    teams.map((team) => [team._id, { ...team, conferenceId: team.conference } as TeamLean])
  );

  const cfbdGames = nodes.map(mapGqlGameToCfbdGame).filter(isBroadcastableGame);
  const { games } = reshapeCfbdGames(cfbdGames, teamMap, venueMap);

  return {
    events: games as GameLean[],
    teams: toTeamMetadata(teams),
    season,
  };
};
