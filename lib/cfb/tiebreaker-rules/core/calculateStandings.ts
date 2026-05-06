import { GameLean, TeamLean } from '../../../types';
import {
  StandingEntry,
  TieLog,
  TieFlowGraph,
  TieFlowNode,
  TieFlowEdge,
  TieFlowTeamMeta,
} from '../../../api-types';
import { CFBConferenceTiebreakerConfig } from './types';
import { getTeamRecord, formatList } from '../common/core-helpers';
import { breakTie } from './breakTie';

const buildTieFlowGraphs = (
  tieLogs: TieLog[],
  standings: StandingEntry[],
  games: GameLean[]
): TieFlowGraph[] => {
  const allTeamMeta: Record<string, TieFlowTeamMeta> = {};
  for (const s of standings) {
    const game = games.find((g) => g.home.teamId === s.teamId || g.away.teamId === s.teamId);
    if (game) {
      const side = game.home.teamId === s.teamId ? game.home : game.away;
      allTeamMeta[s.abbrev] = {
        abbrev: s.abbrev,
        logo: side.logo,
        color: side.color || '000000',
        displayName: s.displayName,
      };
    }
  }

  const recordGroups: { record: string; entries: StandingEntry[] }[] = [];
  let curRec = '';
  let curGroup: StandingEntry[] = [];
  for (const s of standings) {
    const rec = `${s.confRecord.wins}-${s.confRecord.losses}`;
    if (rec !== curRec) {
      if (curGroup.length > 0) recordGroups.push({ record: curRec, entries: curGroup });
      curRec = rec;
      curGroup = [s];
    } else {
      curGroup.push(s);
    }
  }
  if (curGroup.length > 0) recordGroups.push({ record: curRec, entries: curGroup });

  const graphs: TieFlowGraph[] = [];

  for (const group of recordGroups) {
    const abbrevs = group.entries.map((s) => s.abbrev);
    if (abbrevs.length === 1) continue;

    const tieLog = tieLogs.find(
      (tl) => tl.teams.length === abbrevs.length && abbrevs.every((a) => tl.teams.includes(a))
    );
    if (!tieLog) continue;

    const nodes: TieFlowNode[] = [];
    const edges: TieFlowEdge[] = [];
    const teams: Record<string, TieFlowTeamMeta> = {};
    const summary: string[] = [];
    let idCounter = 0;
    const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

    for (const a of tieLog.teams) {
      if (allTeamMeta[a]) teams[a] = allTeamMeta[a];
    }

    const getName = (a: string) => teams[a]?.displayName || a;

    const groupId = nextId('group');
    nodes.push({
      id: groupId,
      teamIds: [...tieLog.teams],
      rule: null,
      detail: `${tieLog.teams.length} teams at ${group.record}`,
      label: `${group.record} — ${tieLog.teams.length}-Way Tie`,
      type: 'root',
    });

    let prevNodeId = groupId;
    let activeTeams = [...tieLog.teams];
    let rankIdx = 0;

    summary.push(
      `${formatList(activeTeams.map(getName))} were tied at ${group.record} in conference play.`
    );

    for (let i = 0; i < tieLog.steps.length; i++) {
      const step = tieLog.steps[i];
      const ruleId = nextId('rule');

      nodes.push({
        id: ruleId,
        teamIds: [...activeTeams],
        rule: step.rule,
        detail: step.detail,
        label: step.rule,
        type: 'rule',
      });

      edges.push({
        id: nextId('e'),
        source: prevNodeId,
        target: ruleId,
        label: '',
        teamIds: [...activeTeams],
      });

      if (!step.tieBroken) {
        summary.push(`${step.rule} did not break the tie. ${step.detail}.`);
        prevNodeId = ruleId;
        continue;
      }

      const placed = step.survivors;
      const remaining = activeTeams.filter((t) => !placed.includes(t));

      for (const winner of placed) {
        const rank = group.entries[rankIdx]?.rank ?? rankIdx + 1;
        const resultId = nextId('res');
        nodes.push({
          id: resultId,
          teamIds: [winner],
          rule: null,
          detail: `#${rank} via ${step.rule}`,
          label: `#${rank}`,
          type: 'result',
        });
        edges.push({
          id: nextId('e'),
          source: ruleId,
          target: resultId,
          label: 'Advances',
          teamIds: [winner],
        });
        rankIdx++;
      }

      const placedNames = placed.map(getName);
      const remainNames = remaining.map(getName);

      if (placed.length === 1 && remaining.length === 1) {
        summary.push(
          `${placedNames[0]} won the tiebreaker over ${remainNames[0]} based on ${step.rule.toLowerCase()}. ${step.detail}.`
        );
      } else if (placed.length === 1 && remaining.length > 1) {
        summary.push(
          `${placedNames[0]} advanced past ${formatList(remainNames)} based on ${step.rule.toLowerCase()}. ${step.detail}.`
        );
      } else if (placed.length > 1) {
        summary.push(
          `${formatList(placedNames)} advanced based on ${step.rule.toLowerCase()}, leaving ${formatList(remainNames)}. ${step.detail}.`
        );
      }

      activeTeams = remaining;

      if (remaining.length === 1) {
        const lastRank = group.entries[rankIdx]?.rank ?? rankIdx + 1;
        const lastId = nextId('res');
        nodes.push({
          id: lastId,
          teamIds: [remaining[0]],
          rule: null,
          detail: `#${lastRank} — last remaining`,
          label: `#${lastRank}`,
          type: 'result',
        });
        edges.push({
          id: nextId('e'),
          source: ruleId,
          target: lastId,
          label: 'Remains',
          teamIds: remaining,
        });
        summary.push(`${getName(remaining[0])} was placed last in the group.`);
        break;
      }

      if (remaining.length === 0) break;
      prevNodeId = ruleId;
    }

    graphs.push({ nodes, edges, teams, summary });
  }

  return graphs;
};

export const calculateStandings = async (
  games: GameLean[],
  allTeams: string[],
  config: CFBConferenceTiebreakerConfig,
  teams: TeamLean[]
): Promise<{ standings: StandingEntry[]; tieLogs: TieLog[]; tieFlowGraphs: TieFlowGraph[] }> => {
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
      const tieResult = await breakTie(
        tiedTeams,
        games,
        allTeams,
        config,
        explanations,
        false,
        teams
      );
      orderedTeams.push(...tieResult.ranked);

      const tiedTeamAbbrevs = tieResult.ranked.map((teamId) => {
        const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
        return game?.home.teamId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
      });

      const stepsWithAbbrevs = tieResult.steps.map((step) => ({
        ...step,
        survivors: step.survivors.map((teamId) => {
          const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
          return game?.home.teamId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
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
    const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId)!;

    const team = game.home.teamId === teamId ? game.home : game.away;
    const teamLean = teams.find((t) => t._id === teamId);

    const recordKey = `${record.wins}-${record.losses}`;
    const teamsWithSameRecord = orderedTeams
      .map((tid, idx) => ({
        teamId: tid,
        rank: idx + 1,
        record: teamRecords.find((r) => r.teamId === tid)!,
      }))
      .filter((t) => `${t.record.wins}-${t.record.losses}` === recordKey);

    let explainPosition = '';

    if (record.losses === 0 && teamsWithSameRecord.length === 1) {
      explainPosition = 'Undefeated in conference play.';
    } else if (record.wins === 0) {
      explainPosition = 'Winless in conference play.';
    } else if (teamsWithSameRecord.length === 1) {
      explainPosition = `Only team with ${recordKey} record.`;
    } else if (teamsWithSameRecord.length > 1) {
      const currentIndex = teamsWithSameRecord.findIndex((t) => t.teamId === teamId);
      const teamsAbove = teamsWithSameRecord.slice(0, currentIndex);
      const teamsBelow = teamsWithSameRecord.slice(currentIndex + 1);

      const getTeamShortNameFromId = (tid: string) => {
        const g = games.find((g) => g.home.teamId === tid || g.away.teamId === tid);
        if (!g) {
          return tid;
        }

        const shortDisplayName =
          g.home.teamId === tid
            ? g.home.shortDisplayName || g.home.displayName || g.home.abbrev
            : g.away.shortDisplayName || g.away.displayName || g.away.abbrev || tid;

        return shortDisplayName || tid;
      };

      const findTieLog = () => {
        return tieLogs.find((log) => {
          const teamAbbrevs = teamsWithSameRecord.map((t) => {
            const g = games.find((g) => g.home.teamId === t.teamId || g.away.teamId === t.teamId);
            return g?.home.teamId === t.teamId ? g.home.abbrev : g?.away.abbrev || t.teamId;
          });
          return teamAbbrevs.every((abbrev) => log.teams.includes(abbrev));
        });
      };

      const tieLog = findTieLog();

      const findSeparatingStep = (team1Id: string, team2Id: string): number | null => {
        if (!tieLog) return null;

        const getAbbrev = (tid: string) => {
          const g = games.find((g) => g.home.teamId === tid || g.away.teamId === tid);
          return g?.home.teamId === tid ? g.home.abbrev : g?.away.abbrev || tid;
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
            (g) => g.home.teamId === teamId || g.away.teamId === teamId
          );
          const opponents = teamGames.map((g) =>
            g.home.teamId === teamId ? g.away.teamId : g.home.teamId
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
            parts.push(`Behind ${formatList(teamNames)} based on ${reason}${reasonValue}.`);
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
            parts.push(`Ahead of ${formatList(teamNames)} based on ${reason}${reasonValue}.`);
          }
        }
      }

      explainPosition = parts.join(' ');
    }

    // Get division from game data
    const division = team.division || null;

    return {
      rank: index + 1,
      teamId,
      abbrev: team.abbrev,
      displayName: team.shortDisplayName || team.displayName || team.abbrev || 'Unknown',
      logo: team.logo || '',
      color: team.color || '000000',
      record: { wins: record.wins, losses: record.losses },
      confRecord: { wins: record.wins, losses: record.losses },
      explainPosition,
      division,
      nationalRank: teamLean?.nationalRank ?? null,
    };
  });

  const tieFlowGraphs = buildTieFlowGraphs(tieLogs, standings, games);

  return { standings, tieLogs, tieFlowGraphs };
};
