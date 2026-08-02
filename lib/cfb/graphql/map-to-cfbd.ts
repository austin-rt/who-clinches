import type { Game, Team } from 'cfbd';

export const COMPLETED_STATUSES = new Set(['completed', 'final']);

export const LINE_PROVIDER_PRIORITY = ['consensus', 'draftkings', 'bovada', 'espn bet'];

export interface GqlLine {
  linesProviderId: number;
  provider: { name: string } | null;
  spread: number | null;
  overUnder: number | null;
}

export interface GqlGameNode {
  id: number;
  season: number;
  week: number;
  seasonType: string;
  startDate: string;
  startTimeTbd: boolean | null;
  status: string | null;
  neutralSite: boolean | null;
  conferenceGame: boolean | null;
  notes: string | null;
  venueId: number | null;
  attendance: number | null;
  excitement: number | null;
  homeTeamId: number;
  homeTeam: string;
  homeConference: string | null;
  homeClassification: string | null;
  homePoints: number | null;
  homeLineScores: number[] | null;
  homeStartElo: number | null;
  homeEndElo: number | null;
  homePostgameWinProb: number | null;
  awayTeamId: number;
  awayTeam: string;
  awayConference: string | null;
  awayClassification: string | null;
  awayPoints: number | null;
  awayLineScores: number[] | null;
  awayStartElo: number | null;
  awayEndElo: number | null;
  awayPostgameWinProb: number | null;
  lines: GqlLine[] | null;
}

export interface GqlTeamNode {
  id: number;
  school: string;
  mascot: string | null;
  abbreviation: string | null;
  conference: string | null;
  division: string | null;
  classification: string | null;
  color: string | null;
  altColor: string | null;
  images: string[] | null;
  altName: string | null;
  nickname: string | null;
  shortDisplayName: string | null;
}

export const buildAlternateNames = (node: GqlTeamNode): string[] => {
  const candidates = [
    node.abbreviation,
    node.school,
    node.shortDisplayName,
    node.altName,
    node.nickname,
  ];
  return Array.from(new Set(candidates.filter((name): name is string => Boolean(name))));
};

export const isCompletedStatus = (status: string | null | undefined): boolean =>
  typeof status === 'string' && COMPLETED_STATUSES.has(status.toLowerCase());

export const pickLine = (lines: GqlLine[] | null | undefined): GqlLine | null => {
  if (!lines || lines.length === 0) return null;
  const withSpread = lines.filter((line) => line.spread !== null && line.spread !== undefined);
  const pool = withSpread.length > 0 ? withSpread : lines;
  const rank = (line: GqlLine): number => {
    const index = LINE_PROVIDER_PRIORITY.indexOf((line.provider?.name ?? '').toLowerCase());
    return index === -1 ? LINE_PROVIDER_PRIORITY.length : index;
  };
  return [...pool].sort((a, b) => rank(a) - rank(b) || a.linesProviderId - b.linesProviderId)[0];
};

export const deriveFavoriteId = (
  spread: number | null | undefined,
  homeTeamId: number,
  awayTeamId: number
): number | undefined => {
  if (spread === null || spread === undefined) return undefined;
  if (spread < 0) return homeTeamId;
  if (spread > 0) return awayTeamId;
  return undefined;
};

type EnrichedGame = Game & { spread?: number; overUnder?: number; favoriteId?: number };

export const mapGqlGameToCfbdGame = (node: GqlGameNode): EnrichedGame => {
  const line = pickLine(node.lines);
  const spread = line?.spread ?? undefined;

  return {
    id: node.id,
    season: node.season,
    week: node.week,
    seasonType: node.seasonType as Game['seasonType'],
    startDate: node.startDate,
    startTimeTBD: node.startTimeTbd ?? false,
    completed: isCompletedStatus(node.status),
    neutralSite: node.neutralSite ?? false,
    conferenceGame: node.conferenceGame ?? false,
    attendance: node.attendance ?? null,
    venueId: node.venueId ?? null,
    venue: null,
    homeId: node.homeTeamId,
    homeTeam: node.homeTeam,
    homeConference: node.homeConference ?? null,
    homeClassification: node.homeClassification as Game['homeClassification'],
    homePoints: node.homePoints ?? null,
    homeLineScores: node.homeLineScores ?? null,
    homePostgameWinProbability: node.homePostgameWinProb ?? null,
    homePregameElo: node.homeStartElo ?? null,
    homePostgameElo: node.homeEndElo ?? null,
    awayId: node.awayTeamId,
    awayTeam: node.awayTeam,
    awayConference: node.awayConference ?? null,
    awayClassification: node.awayClassification as Game['awayClassification'],
    awayPoints: node.awayPoints ?? null,
    awayLineScores: node.awayLineScores ?? null,
    awayPostgameWinProbability: node.awayPostgameWinProb ?? null,
    awayPregameElo: node.awayStartElo ?? null,
    awayPostgameElo: node.awayEndElo ?? null,
    excitementIndex: node.excitement ?? null,
    highlights: null,
    notes: node.notes ?? null,
    spread,
    overUnder: line?.overUnder ?? undefined,
    favoriteId: deriveFavoriteId(spread, node.homeTeamId, node.awayTeamId),
  } as EnrichedGame;
};

export const mapGqlTeamToCfbdTeam = (node: GqlTeamNode): Team =>
  ({
    id: node.id,
    school: node.school,
    mascot: node.mascot ?? null,
    abbreviation: node.abbreviation ?? null,
    alternateNames: buildAlternateNames(node),
    conference: node.conference ?? null,
    division: node.division ?? null,
    classification: node.classification as Team['classification'],
    color: node.color ? `#${node.color.replace(/^#/, '')}` : null,
    alternateColor: node.altColor ? `#${node.altColor.replace(/^#/, '')}` : null,
    logos: node.images ?? null,
    twitter: null,
    location: null,
  }) as Team;
