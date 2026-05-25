import type { Game } from '../../../types';
import type { NflStandingEntry, NflPlayoffBracket, NflTieLog } from '../../types';
import {
  NFL_DIVISIONS,
  NFL_CONFERENCES,
  NFL_TEAM_BY_ESPN_ID,
  getPlayoffSize,
  type NflConference,
  type NflDivisionId,
} from '../../constants';
import { DIVISION_TIEBREAKER_CONFIG } from '../division-config';
import { WILDCARD_TIEBREAKER_CONFIG } from '../wildcard-config';
import { rankTeams, type NflRankedTeam } from './calculateStandings';
import { getTeamRecord, getTeamAbbrev, isConferenceGame, isDivisionGame } from '../helpers';

const buildStandingEntry = (
  teamId: string,
  seed: number,
  allGames: Game[],
  isDivWinner: boolean
): NflStandingEntry => {
  const meta = NFL_TEAM_BY_ESPN_ID.get(teamId);
  const overall = getTeamRecord(teamId, allGames);
  const confGames = allGames.filter(
    (g) => (g.home.teamId === teamId || g.away.teamId === teamId) && isConferenceGame(g)
  );
  const confRecord = getTeamRecord(teamId, confGames);
  const divGames = allGames.filter(
    (g) => (g.home.teamId === teamId || g.away.teamId === teamId) && isDivisionGame(g)
  );
  const divisionRecord = getTeamRecord(teamId, divGames);

  const abbrev = meta?.abbrev ?? getTeamAbbrev(teamId, allGames);
  const game = allGames.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
  const side = game?.home.teamId === teamId ? game.home : game?.away;

  return {
    seed,
    teamId,
    abbrev,
    displayName: meta?.displayName ?? side?.displayName ?? abbrev,
    logo: side?.logo ?? '',
    color: side?.color ?? '000000',
    record: overall,
    confRecord,
    divisionRecord,
    explainPosition: '',
    division: meta?.divisionId ?? '',
    conference: meta?.conference ?? '',
    isDivisionWinner: isDivWinner,
  };
};

export interface PlayoffPictureResult {
  bracket: NflPlayoffBracket;
  divisionStandings: Record<string, NflStandingEntry[]>;
  tieLogs: NflTieLog[];
}

export const calculatePlayoffPicture = (allGames: Game[], season: number): PlayoffPictureResult => {
  const allTieLogs: NflTieLog[] = [];
  const divisionStandings: Record<string, NflStandingEntry[]> = {};
  const divisionWinners: Map<NflConference, string[]> = new Map([
    ['AFC', []],
    ['NFC', []],
  ]);
  const divisionRankings: Map<NflDivisionId, NflRankedTeam[]> = new Map();

  for (const divId of NFL_DIVISIONS) {
    const teamMetas = NFL_TEAM_BY_ESPN_ID.entries();
    const divTeamIds: string[] = [];
    for (const [espnId, meta] of teamMetas) {
      if (meta.divisionId === divId) divTeamIds.push(espnId);
    }

    const { ranked, tieLogs } = rankTeams(
      divTeamIds,
      allGames,
      DIVISION_TIEBREAKER_CONFIG,
      'division'
    );

    divisionRankings.set(divId, ranked);
    allTieLogs.push(...tieLogs);

    const divStandings = ranked.map((rt) =>
      buildStandingEntry(rt.teamId, rt.rank, allGames, rt.rank === 1)
    );
    divisionStandings[divId] = divStandings;

    const winnerId = ranked[0]?.teamId;
    if (winnerId) {
      const conf = NFL_TEAM_BY_ESPN_ID.get(winnerId)?.conference;
      if (conf) divisionWinners.get(conf)!.push(winnerId);
    }
  }

  const playoffSize = getPlayoffSize(season);
  const wcCount = playoffSize - 4;

  const bracket: NflPlayoffBracket = { afc: [], nfc: [] };

  for (const conf of NFL_CONFERENCES) {
    const confWinnerIds = divisionWinners.get(conf) ?? [];

    const { ranked: seededWinners, tieLogs: winnerTieLogs } = rankTeams(
      confWinnerIds,
      allGames,
      WILDCARD_TIEBREAKER_CONFIG,
      'wildcard',
      divisionRankings as Map<string, NflRankedTeam[]>
    );
    allTieLogs.push(...winnerTieLogs);

    const nonWinnerIds: string[] = [];
    for (const divId of NFL_DIVISIONS) {
      if (!divId.startsWith(conf)) continue;
      const rankings = divisionRankings.get(divId);
      if (!rankings) continue;
      for (const rt of rankings) {
        if (rt.rank > 1) nonWinnerIds.push(rt.teamId);
      }
    }

    const { ranked: seededWildCards, tieLogs: wcTieLogs } = rankTeams(
      nonWinnerIds,
      allGames,
      WILDCARD_TIEBREAKER_CONFIG,
      'wildcard',
      divisionRankings as Map<string, NflRankedTeam[]>
    );
    allTieLogs.push(...wcTieLogs);

    const confEntries: NflStandingEntry[] = [];

    for (let i = 0; i < seededWinners.length; i++) {
      const entry = buildStandingEntry(seededWinners[i].teamId, i + 1, allGames, true);
      confEntries.push(entry);
    }

    for (let i = 0; i < wcCount && i < seededWildCards.length; i++) {
      const seed = seededWinners.length + i + 1;
      const entry = buildStandingEntry(seededWildCards[i].teamId, seed, allGames, false);
      confEntries.push(entry);
    }

    const key = conf.toLowerCase() as 'afc' | 'nfc';
    bracket[key] = confEntries;
  }

  return { bracket, divisionStandings, tieLogs: allTieLogs };
};
