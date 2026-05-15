import { runConferenceSimulation } from '@/lib/cfb/runConferenceSimulation';
import type { GameLean, TeamLean } from '@/lib/types';
import type { CFBConferenceAbbreviation } from '@/lib/cfb/constants';

export interface ScenarioPath {
  gameId: string;
  winnerTeamId: string;
}

export interface EnumerateScenariosResult {
  paths: ScenarioPath[][];
  exhaustive: boolean;
  scenariosChecked: number;
}

interface EnumerateScenariosParams {
  games: GameLean[];
  teams: TeamLean[];
  overrides: Record<string, { homeScore: number; awayScore: number }>;
  conf: CFBConferenceAbbreviation;
  teamId: string;
  maxScenarios?: number;
  maxMs?: number;
}

const DEFAULT_MAX_SCENARIOS = 100_000;
const DEFAULT_MAX_MS = 50_000;

export const enumerateScenarios = async ({
  games,
  teams,
  overrides,
  conf,
  teamId,
  maxScenarios = DEFAULT_MAX_SCENARIOS,
  maxMs = DEFAULT_MAX_MS,
}: EnumerateScenariosParams): Promise<EnumerateScenariosResult> => {
  if (maxScenarios === 0 || maxMs === 0) {
    return { paths: [], exhaustive: false, scenariosChecked: 0 };
  }

  const conferenceTeamIds = new Set(teams.map((t) => t._id));

  const undecidedGames = games.filter(
    (g) =>
      !g.completed &&
      !overrides[g._id] &&
      conferenceTeamIds.has(g.home.teamId) &&
      conferenceTeamIds.has(g.away.teamId)
  );

  if (undecidedGames.length === 0) {
    const result = await runConferenceSimulation({ games, teams, overrides, conf });
    const inChampionship = result.championship.includes(teamId);
    return {
      paths: inChampionship ? [[]] : [],
      exhaustive: true,
      scenariosChecked: 1,
    };
  }

  const totalCombinations = 2 ** undecidedGames.length;
  const cap = Math.min(totalCombinations, maxScenarios);
  const paths: ScenarioPath[][] = [];
  const startTime = Date.now();
  let scenariosChecked = 0;

  for (let i = 0; i < totalCombinations; i++) {
    if (scenariosChecked >= cap || Date.now() - startTime > maxMs) {
      return { paths, exhaustive: false, scenariosChecked };
    }

    const scenarioOverrides: Record<string, { homeScore: number; awayScore: number }> = {
      ...overrides,
    };
    const path: ScenarioPath[] = [];

    for (let bit = 0; bit < undecidedGames.length; bit++) {
      const game = undecidedGames[bit];
      const homeWins = (i >> bit) & 1;
      if (homeWins) {
        scenarioOverrides[game._id] = { homeScore: 1, awayScore: 0 };
        path.push({ gameId: game._id, winnerTeamId: game.home.teamId });
      } else {
        scenarioOverrides[game._id] = { homeScore: 0, awayScore: 1 };
        path.push({ gameId: game._id, winnerTeamId: game.away.teamId });
      }
    }

    const result = await runConferenceSimulation({
      games,
      teams,
      overrides: scenarioOverrides,
      conf,
    });

    if (result.championship.includes(teamId)) {
      paths.push(path);
    }

    scenariosChecked++;
  }

  return { paths, exhaustive: true, scenariosChecked };
};
