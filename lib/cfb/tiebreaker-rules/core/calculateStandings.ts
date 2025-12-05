import { GameLean } from '../../../types';
import { StandingEntry, TieLog } from '../../../api-types';
import { ConferenceTiebreakerConfig } from './types';
import { getTeamRecord } from '../common/core-helpers';
import { breakTie } from './breakTie';

export const calculateStandings = (
  games: GameLean[],
  allTeams: string[],
  config: ConferenceTiebreakerConfig
): { standings: StandingEntry[]; tieLogs: TieLog[] } => {
  const explanations = new Map<string, string[]>();
  const tieLogs: TieLog[] = [];

  const teamRecords = allTeams.map((teamId) => ({
    teamId,
    ...getTeamRecord(teamId, games),
  }));

  const winPctGroups = new Map<number, string[]>();
  for (const record of teamRecords) {
    const pct = Math.round(record.winPct * 10000) / 10000;
    if (!winPctGroups.has(pct)) {
      winPctGroups.set(pct, []);
    }
    winPctGroups.get(pct)!.push(record.teamId);
  }

  const sortedGroups = [...winPctGroups.entries()].sort((a, b) => b[0] - a[0]);

  const orderedTeams: string[] = [];

  for (const [, tiedTeams] of sortedGroups) {
    if (tiedTeams.length === 1) {
      orderedTeams.push(tiedTeams[0]);
    } else {
      const tieResult = breakTie(tiedTeams, games, allTeams, config, explanations);
      orderedTeams.push(...tieResult.ranked);

      const tiedTeamAbbrevs = tieResult.ranked.map((teamId) => {
        const game = games.find(
          (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
        );
        return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
      });

      const stepsWithAbbrevs = tieResult.steps.map((step) => ({
        ...step,
        survivors: step.survivors.map((teamId) => {
          const game = games.find(
            (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
          );
          return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
        }),
      }));

      tieLogs.push({
        teams: tiedTeamAbbrevs,
        steps: stepsWithAbbrevs,
      });
    }
  }

  const standings: StandingEntry[] = orderedTeams.map((teamId, index) => {
    const record = teamRecords.find((r) => r.teamId === teamId)!;
    const game = games.find((g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId)!;

    const team = game.home.teamEspnId === teamId ? game.home : game.away;

    const recordKey = `${record.wins}-${record.losses}`;
    const teamsWithSameRecord = orderedTeams
      .map((tid, idx) => ({
        teamId: tid,
        rank: idx + 1,
        record: teamRecords.find((r) => r.teamId === tid)!,
      }))
      .filter((t) => `${t.record.wins}-${t.record.losses}` === recordKey);

    let explainPosition = '';

    if (teamsWithSameRecord.length > 1) {
      const currentIndex = teamsWithSameRecord.findIndex((t) => t.teamId === teamId);
      const teamsAbove = teamsWithSameRecord.slice(0, currentIndex);
      const teamsBelow = teamsWithSameRecord.slice(currentIndex + 1);

      const getTeamShortNameFromId = (tid: string) => {
        const g = games.find((g) => g.home.teamEspnId === tid || g.away.teamEspnId === tid);
        if (!g) {
          return tid;
        }

        const shortDisplayName =
          g.home.teamEspnId === tid
            ? g.home.shortDisplayName || g.home.displayName || g.home.abbrev
            : g.away.shortDisplayName || g.away.displayName || g.away.abbrev || tid;

        return shortDisplayName || tid;
      };

      const findTieLog = () => {
        return tieLogs.find((log) => {
          const teamAbbrevs = teamsWithSameRecord.map((t) => {
            const g = games.find(
              (g) => g.home.teamEspnId === t.teamId || g.away.teamEspnId === t.teamId
            );
            return g?.home.teamEspnId === t.teamId ? g.home.abbrev : g?.away.abbrev || t.teamId;
          });
          return teamAbbrevs.every((abbrev) => log.teams.includes(abbrev));
        });
      };

      const tieLog = findTieLog();

      const findSeparatingStep = (team1Id: string, team2Id: string): number | null => {
        if (!tieLog) return null;

        const getAbbrev = (tid: string) => {
          const g = games.find((g) => g.home.teamEspnId === tid || g.away.teamEspnId === tid);
          return g?.home.teamEspnId === tid ? g.home.abbrev : g?.away.abbrev || tid;
        };

        const team1Abbrev = getAbbrev(team1Id);
        const team2Abbrev = getAbbrev(team2Id);

        let activeTeams = new Set(tieLog.teams);

        for (let i = 0; i < tieLog.steps.length; i++) {
          const step = tieLog.steps[i];
          const survivors = new Set(step.survivors);

          const bothActive = activeTeams.has(team1Abbrev) && activeTeams.has(team2Abbrev);

          if (bothActive) {
            const team1Survived = survivors.has(team1Abbrev);
            const team2Survived = survivors.has(team2Abbrev);

            if (team1Survived !== team2Survived) {
              return i;
            }
          }

          activeTeams = survivors;
        }

        return null;
      };

      const getReasonFromStep = (stepIndex: number): { reason: string; reasonValue: string } => {
        if (!tieLog || stepIndex < 0 || stepIndex >= tieLog.steps.length) {
          return { reason: '', reasonValue: '' };
        }

        const step = tieLog.steps[stepIndex];
        let reason = '';
        let reasonValue = '';

        if (step.rule.includes('Head-to-Head')) {
          reason = 'head-to-head record';
        } else if (step.rule.includes('Common Opponents')) {
          reason = 'record vs common opponents';
        } else if (step.rule.includes('Highest Placed')) {
          const oppMatch = step.detail.match(/Record vs (.+)/);
          if (oppMatch) {
            reason = `record against highest-placed common opponent (${oppMatch[1]})`;
          } else {
            reason = 'record against highest-placed common opponent';
          }
        } else if (step.rule.includes('Opponent Win Percentage')) {
          const teamGames = games.filter(
            (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
          );
          const opponents = teamGames.map((g) =>
            g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId
          );
          let totalWins = 0;
          let totalGames = 0;
          for (const oppId of opponents) {
            const oppRecord = getTeamRecord(oppId, games);
            totalWins += oppRecord.wins;
            totalGames += oppRecord.wins + oppRecord.losses;
          }
          const teamOppWinPct = totalGames === 0 ? 0 : totalWins / totalGames;
          reason = 'conference opponent win percentage';
          reasonValue = ` (${teamOppWinPct.toFixed(4)})`;
        } else if (step.rule.includes('Scoring Margin')) {
          reason = 'scoring margin';
        } else if (step.rule.includes('Team Rating Score')) {
          reason = 'Team Rating Score';
        } else {
          reason = step.detail.toLowerCase();
        }

        return { reason, reasonValue };
      };

      const parts: string[] = [];

      if (teamsAbove.length > 0) {
        const teamsByStep = new Map<number, string[]>();

        for (const otherTeam of teamsAbove) {
          const stepIndex = findSeparatingStep(teamId, otherTeam.teamId);
          if (stepIndex !== null) {
            if (!teamsByStep.has(stepIndex)) {
              teamsByStep.set(stepIndex, []);
            }
            teamsByStep.get(stepIndex)!.push(otherTeam.teamId);
          }
        }

        const sortedSteps = Array.from(teamsByStep.entries()).sort((a, b) => a[0] - b[0]);

        for (const [stepIndex, teamIds] of sortedSteps) {
          const { reason, reasonValue } = getReasonFromStep(stepIndex);
          if (reason) {
            const teamNames = teamIds.map((tid) => getTeamShortNameFromId(tid));
            parts.push(`Behind ${teamNames.join(' and ')} based on ${reason}${reasonValue}.`);
          }
        }
      }

      if (teamsBelow.length > 0) {
        const teamsByStep = new Map<number, string[]>();

        for (const otherTeam of teamsBelow) {
          const stepIndex = findSeparatingStep(teamId, otherTeam.teamId);
          if (stepIndex !== null) {
            if (!teamsByStep.has(stepIndex)) {
              teamsByStep.set(stepIndex, []);
            }
            teamsByStep.get(stepIndex)!.push(otherTeam.teamId);
          }
        }

        const sortedSteps = Array.from(teamsByStep.entries()).sort((a, b) => a[0] - b[0]);

        for (const [stepIndex, teamIds] of sortedSteps) {
          const { reason, reasonValue } = getReasonFromStep(stepIndex);
          if (reason) {
            const teamNames = teamIds.map((tid) => getTeamShortNameFromId(tid));
            parts.push(`Ahead of ${teamNames.join(' and ')} based on ${reason}${reasonValue}.`);
          }
        }
      }

      explainPosition = parts.join(' ');
    }

    return {
      rank: index + 1,
      teamId,
      abbrev: team.abbrev,
      displayName: team.displayName || team.abbrev || 'Unknown',
      logo: team.logo || '',
      color: team.color || '000000',
      record: { wins: record.wins, losses: record.losses },
      confRecord: { wins: record.wins, losses: record.losses },
      explainPosition,
    };
  });

  return { standings, tieLogs };
};

