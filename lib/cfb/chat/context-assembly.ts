import { getGames, getTeams } from '@/lib/cfb/cfbd-cached';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { runConferenceSimulation } from '@/lib/cfb/runConferenceSimulation';
import { enumerateScenarios, type ScenarioPath } from '@/lib/cfb/enumerateScenarios';
import {
  CFB_CONFERENCE_METADATA,
  CFBD_CONFERENCE_NAME_TO_ABBR,
  type CFBConferenceAbbreviation,
} from '@/lib/cfb/constants';
import { CFBD_SEASON_TYPE } from '@/lib/constants';
import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';
import type { TeamIndexEntry } from '@/lib/cfb/helpers/fuzzy-team-matcher';
import type { StandingEntry } from '@/lib/api-types';
import type { GameLean, TeamLean } from '@/lib/types';
import type { RetrievedChunk } from '@/lib/rag/retrieval';

const CFBD_NAME_TO_ROUTE_SLUG: Record<string, CFBConferenceAbbreviation> = {};
for (const [slug, meta] of Object.entries(CFB_CONFERENCE_METADATA)) {
  CFBD_NAME_TO_ROUTE_SLUG[meta.cfbdId] = slug as CFBConferenceAbbreviation;
}

export const resolveConferenceSlug = (
  cfbdConferenceName: string
): CFBConferenceAbbreviation | null => {
  const abbr = CFBD_CONFERENCE_NAME_TO_ABBR[cfbdConferenceName];
  if (abbr && abbr in CFBD_NAME_TO_ROUTE_SLUG) {
    return CFBD_NAME_TO_ROUTE_SLUG[abbr] ?? null;
  }
  return CFBD_NAME_TO_ROUTE_SLUG[cfbdConferenceName] ?? null;
};

interface ConferenceData {
  conf: CFBConferenceAbbreviation;
  games: GameLean[];
  teams: TeamLean[];
  standings: StandingEntry[];
  championship: string[];
}

export const loadConferenceData = async (
  conf: CFBConferenceAbbreviation
): Promise<ConferenceData> => {
  const meta = CFB_CONFERENCE_METADATA[conf];
  const season = await getDefaultSeasonFromCfbd();
  const cfbdId = meta.cfbdId;

  const [teamsByConf, cfbdGames] = await Promise.all([
    getTeams(season),
    getGames({
      year: season,
      conference: cfbdId,
      seasonType: CFBD_SEASON_TYPE.REGULAR,
    }),
  ]);

  const cfbdTeams = teamsByConf[cfbdId] ?? [];
  const reshapedTeams = extractTeamsFromCfbd(cfbdTeams, cfbdId);
  const teams: TeamLean[] = reshapedTeams.map((t) => ({
    _id: t._id,
    name: t.name,
    displayName: t.displayName,
    shortDisplayName: t.shortDisplayName,
    abbreviation: t.abbreviation,
    mascot: t.mascot,
    alternateNames: t.alternateNames,
    logo: t.logo,
    color: t.color,
    alternateColor: t.alternateColor,
    conferenceId: cfbdId,
    division: t.division,
    record: t.record,
    conferenceStanding: t.conferenceStanding,
  }));

  const teamMap = new Map<string, TeamLean>(teams.map((t) => [t._id, t]));
  const reshaped = reshapeCfbdGames(cfbdGames, teamMap);
  const games: GameLean[] = reshaped.games.map((g) => ({ _id: g.id, ...g }));

  const result = await runConferenceSimulation({
    games,
    teams,
    overrides: {},
    conf,
  });

  return {
    conf,
    games,
    teams,
    standings: result.standings,
    championship: result.championship,
  };
};

interface ScenarioSummary {
  totalScenarios: number;
  pathCount: number;
  exhaustive: boolean;
  samplePaths: ScenarioPath[][];
}

export const loadTeamScenarios = async (
  conf: CFBConferenceAbbreviation,
  teamId: string,
  games: GameLean[],
  teams: TeamLean[]
): Promise<ScenarioSummary> => {
  const result = await enumerateScenarios({
    conf,
    teamId,
    games,
    teams,
    overrides: {},
    maxScenarios: 10_000,
    maxMs: 10_000,
  });

  return {
    totalScenarios: result.scenariosChecked,
    pathCount: result.paths.length,
    exhaustive: result.exhaustive,
    samplePaths: result.paths.slice(0, 5),
  };
};

export const buildSystemPrompt = (confName: string, hasRagContext: boolean): string => {
  const ruleGuidance = hasRagContext
    ? `You have access to the official tiebreaker rule documents for ${confName}. ` +
      `When asked about tiebreaker rules, reference the provided rule text. ` +
      `The standings are the authoritative result of applying these rules — you can explain the rules but defer to the standings for actual outcomes.`
    : `The standings you see are produced by a simulation engine that applies the official ${confName} tiebreaker rules automatically. ` +
      `You do not need to know the tiebreaker rules yourself — the standings already reflect them. ` +
      `If asked about tiebreaker rules, explain that the simulation handles them and point to the standings as the authoritative result.`;

  return (
    `You are an analyst for whoclinches.com, a college football conference championship tiebreaker simulator. ` +
    `You are chatting with a fan about the ${confName} championship race. ` +
    `You have complete data: current standings, every completed game with scores, and the remaining schedule. ` +
    `${ruleGuidance}\n\n` +
    `Key facts:\n` +
    `- The top 2 teams in the final conference standings make the championship game.\n` +
    `- Never ask the user for information. You have all the data you need.\n` +
    `- Never speculate about things outside your data (polls, CFP rankings, injuries, etc).\n` +
    `- Give definitive answers when the data supports it. Say "eliminated" or "clinched" when true.\n` +
    `- When a team's path depends on other results, list the specific games that matter.\n` +
    `- Be concise. No filler, no hedging, no "great question." Write like you are texting a knowledgeable friend.\n` +
    `- Do not use markdown. Plain text only.`
  );
};

export const formatRagContext = (chunks: RetrievedChunk[]): string => {
  const sections = chunks.map((c) => c.content);
  return 'Relevant tiebreaker rules:\n\n' + sections.join('\n\n');
};

export const formatStandingsContext = (standings: StandingEntry[], teams: TeamLean[]): string => {
  const teamMap = new Map(teams.map((t) => [t._id, t]));
  const lines = standings.map((s) => {
    const team = teamMap.get(s.teamId);
    const name = team?.shortDisplayName ?? s.displayName;
    const conf = `${s.confRecord.wins}-${s.confRecord.losses}`;
    const overall = `${s.record.wins}-${s.record.losses}`;
    const rank = s.nationalRank ? `#${s.nationalRank} ` : '';
    return `${s.rank}. ${rank}${name} (${conf} conf, ${overall} overall)`;
  });
  return 'Current conference standings:\n' + lines.join('\n');
};

export const formatGamesContext = (games: GameLean[], teams: TeamLean[]): string => {
  const teamMap = new Map(teams.map((t) => [t._id, t]));
  const completed = games.filter((g) => g.completed);
  const remaining = games.filter((g) => !g.completed);
  const parts: string[] = [];

  if (completed.length > 0) {
    const completedLines = completed.map((g) => {
      const home = teamMap.get(g.home.teamId)?.shortDisplayName ?? g.home.abbrev;
      const away = teamMap.get(g.away.teamId)?.shortDisplayName ?? g.away.abbrev;
      return `Week ${g.week}: ${away} ${g.away.score ?? 0} at ${home} ${g.home.score ?? 0}`;
    });
    parts.push(`Completed conference games (${completed.length}):\n` + completedLines.join('\n'));
  }

  if (remaining.length > 0) {
    const remainingLines = remaining.map((g) => {
      const home = teamMap.get(g.home.teamId)?.shortDisplayName ?? g.home.abbrev;
      const away = teamMap.get(g.away.teamId)?.shortDisplayName ?? g.away.abbrev;
      return `Week ${g.week}: ${away} at ${home}`;
    });
    parts.push(`Remaining conference games (${remaining.length}):\n` + remainingLines.join('\n'));
  } else {
    parts.push('All conference games have been played.');
  }

  return parts.join('\n\n');
};

export const formatScenarioContext = (
  teamName: string,
  scenarios: ScenarioSummary,
  games: GameLean[],
  teams: TeamLean[]
): string => {
  const teamMap = new Map(teams.map((t) => [t._id, t]));
  const gameMap = new Map(games.map((g) => [g._id, g]));

  if (scenarios.pathCount === 0) {
    return `${teamName} has been eliminated from conference championship contention.`;
  }

  const remaining = games.filter((g) => !g.completed);
  if (remaining.length === 0) {
    return `${teamName} has clinched a spot in the conference championship game.`;
  }

  const total = scenarios.exhaustive
    ? `Out of ${scenarios.totalScenarios} possible outcomes`
    : `Of the ${scenarios.totalScenarios} scenarios checked (search was not exhaustive)`;

  let text = `${total}, ${teamName} makes the championship game in ${scenarios.pathCount} scenario${scenarios.pathCount === 1 ? '' : 's'}.\n`;

  for (let i = 0; i < scenarios.samplePaths.length; i++) {
    const path = scenarios.samplePaths[i];
    const outcomes = path.map((step) => {
      const game = gameMap.get(step.gameId);
      const winner = teamMap.get(step.winnerTeamId)?.shortDisplayName ?? step.winnerTeamId;
      if (!game) return `${winner} wins`;
      const opponent =
        step.winnerTeamId === game.home.teamId
          ? (teamMap.get(game.away.teamId)?.shortDisplayName ?? game.away.abbrev)
          : (teamMap.get(game.home.teamId)?.shortDisplayName ?? game.home.abbrev);
      return `${winner} beats ${opponent}`;
    });
    text += `\nScenario ${i + 1}: ${outcomes.join(', ')}`;
  }

  if (scenarios.pathCount > scenarios.samplePaths.length) {
    text += `\n\n(${scenarios.pathCount - scenarios.samplePaths.length} more scenarios not shown)`;
  }

  return text;
};

export const resolveTeamConference = (team: TeamIndexEntry): CFBConferenceAbbreviation | null => {
  if (!team.conference) return null;
  return resolveConferenceSlug(team.conference);
};
