import type { Game } from '../../../types';
import type { NflTiebreakerConfig } from '../types';
import { nflWinPct, type NflTieLog, type NflTieStep } from '../../types';
import { getTeamRecord, getTeamAbbrev } from '../helpers';
import { breakTie } from './breakTie';

export interface NflRankedTeam {
  teamId: string;
  rank: number;
}

export const rankTeams = (
  teamIds: string[],
  allGames: Game[],
  config: NflTiebreakerConfig,
  procedure: 'division' | 'wildcard',
  divisionRankings?: Map<string, NflRankedTeam[]>
): { ranked: NflRankedTeam[]; tieLogs: NflTieLog[] } => {
  const tieLogs: NflTieLog[] = [];

  const teamRecords = teamIds.map((teamId) => ({
    teamId,
    record: getTeamRecord(teamId, allGames),
  }));

  const winPctGroups = new Map<number, string[]>();
  for (const tr of teamRecords) {
    const pct = Math.round(nflWinPct(tr.record) * 10000) / 10000;
    if (!winPctGroups.has(pct)) winPctGroups.set(pct, []);
    winPctGroups.get(pct)!.push(tr.teamId);
  }

  const sortedGroups = [...winPctGroups.entries()].sort((a, b) => b[0] - a[0]);
  const orderedTeams: string[] = [];

  for (const [, group] of sortedGroups) {
    if (group.length === 1) {
      orderedTeams.push(group[0]);
      continue;
    }

    const tieResult = breakTie(
      group,
      allGames,
      allGames,
      config,
      procedure === 'wildcard' ? divisionRankings : undefined
    );
    orderedTeams.push(...tieResult.ranked);

    const tiedTeamAbbrevs = tieResult.ranked.map((tid) => getTeamAbbrev(tid, allGames));

    const stepsWithAbbrevs: NflTieStep[] = tieResult.steps.map((step) => ({
      ...step,
      survivors: step.survivors.map((tid) => getTeamAbbrev(tid, allGames)),
    }));

    tieLogs.push({
      teams: tiedTeamAbbrevs,
      procedure,
      steps: stepsWithAbbrevs,
    });
  }

  const ranked: NflRankedTeam[] = orderedTeams.map((teamId, i) => ({
    teamId,
    rank: i + 1,
  }));

  return { ranked, tieLogs };
};
