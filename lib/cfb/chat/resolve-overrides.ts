import { getTeamMatcher } from '@/lib/cfb/helpers/team-index';
import { loadConferenceData, resolveTeamConference } from './context-assembly';
import type { CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import type { GameLean } from '@/lib/types';

interface OverrideInput {
  home_team: string;
  away_team: string;
  winner: string;
}

interface ResolvedOverride {
  gameId: string;
  winnerTeamId: string;
  homeScore: number;
  awayScore: number;
}

interface UnresolvableOverride {
  input: OverrideInput;
  reason: string;
}

interface ResolveResult {
  resolved: Map<CFBConferenceAbbreviation, ResolvedOverride[]>;
  unresolvable: UnresolvableOverride[];
}

export const resolveOverrides = async (inputs: OverrideInput[]): Promise<ResolveResult> => {
  const matcher = await getTeamMatcher();
  const resolved = new Map<CFBConferenceAbbreviation, ResolvedOverride[]>();
  const unresolvable: UnresolvableOverride[] = [];
  const confDataCache = new Map<CFBConferenceAbbreviation, GameLean[]>();

  for (const input of inputs) {
    const homeMatch = matcher.bestMatch(input.home_team);
    const awayMatch = matcher.bestMatch(input.away_team);

    if (!homeMatch || homeMatch.score > 0.4) {
      unresolvable.push({ input, reason: `Could not identify team "${input.home_team}"` });
      continue;
    }
    if (!awayMatch || awayMatch.score > 0.4) {
      unresolvable.push({ input, reason: `Could not identify team "${input.away_team}"` });
      continue;
    }

    const homeConf = resolveTeamConference(homeMatch.team);
    const awayConf = resolveTeamConference(awayMatch.team);

    if (!homeConf || !awayConf) {
      unresolvable.push({ input, reason: 'Could not determine conference for one or both teams' });
      continue;
    }

    if (homeConf !== awayConf) {
      unresolvable.push({
        input,
        reason: `${homeMatch.team.school} (${homeConf.toUpperCase()}) and ${awayMatch.team.school} (${awayConf.toUpperCase()}) are in different conferences — this matchup doesn't affect conference standings`,
      });
      continue;
    }

    const conf = homeConf;
    if (!confDataCache.has(conf)) {
      const data = await loadConferenceData(conf);
      confDataCache.set(conf, data.games);
    }
    const games = confDataCache.get(conf)!;

    const homeId = String(homeMatch.team.id);
    const awayId = String(awayMatch.team.id);

    const game = games.find(
      (g) =>
        (g.home.teamId === homeId && g.away.teamId === awayId) ||
        (g.home.teamId === awayId && g.away.teamId === homeId)
    );

    if (!game) {
      unresolvable.push({
        input,
        reason: `${homeMatch.team.school} and ${awayMatch.team.school} don't play each other in conference this season`,
      });
      continue;
    }

    const winnerMatch = matcher.bestMatch(input.winner);
    if (!winnerMatch || winnerMatch.score > 0.4) {
      unresolvable.push({ input, reason: `Could not identify winner "${input.winner}"` });
      continue;
    }

    const winnerId = String(winnerMatch.team.id);
    if (winnerId !== homeId && winnerId !== awayId) {
      unresolvable.push({
        input,
        reason: `Winner "${winnerMatch.team.school}" is not one of the teams in this matchup`,
      });
      continue;
    }

    const isHomeWinner = winnerId === game.home.teamId;

    if (!resolved.has(conf)) resolved.set(conf, []);
    resolved.get(conf)!.push({
      gameId: game._id,
      winnerTeamId: winnerId,
      homeScore: isHomeWinner ? 1 : 0,
      awayScore: isHomeWinner ? 0 : 1,
    });
  }

  return { resolved, unresolvable };
};
