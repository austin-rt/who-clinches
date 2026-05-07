import { GameLean, TeamLean } from '@/lib/types';
import { CFBConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';
import { breakTie } from '@/lib/cfb/tiebreaker-rules/core/breakTie';

interface TeamForTiebreaker {
  teamId: string;
  abbrev: string;
  conferenceId?: string;
  division?: string | null;
  nationalRank?: number | null;
  spPlusRating?: number | null;
  sor?: number | null;
}

export const createTeamLean = (team: TeamForTiebreaker): TeamLean => ({
  _id: team.teamId,
  name: team.abbrev,
  displayName: team.abbrev,
  shortDisplayName: team.abbrev,
  abbreviation: team.abbrev,
  logo: '',
  color: '000000',
  alternateColor: 'ffffff',
  conferenceId: team.conferenceId ?? 'TEST',
  division: team.division ?? null,
  record: { overall: '0-0', conference: '0-0', home: '0-0', away: '0-0', stats: {} },
  conferenceStanding: '',
  nationalRank: team.nationalRank ?? null,
  spPlusRating: team.spPlusRating ?? null,
  sor: team.sor ?? null,
});

export const runTiebreaker = async (args: {
  tiedTeams: string[];
  games: GameLean[];
  allTeams: string[];
  config: CFBConferenceTiebreakerConfig;
  teams?: TeamLean[];
}) => {
  const explanations = new Map<string, string[]>();
  const { ranked, steps } = await breakTie(
    args.tiedTeams,
    args.games,
    args.allTeams,
    args.config,
    explanations,
    false,
    args.teams ?? []
  );
  return { ranked, steps, explanations };
};

interface GameForTiebreaker {
  gameId: string;
  home: {
    teamId: string;
    score: number | null;
    abbrev: string;
    division?: string | null;
  };
  away: {
    teamId: string;
    score: number | null;
    abbrev: string;
    division?: string | null;
  };
}

export const createGameLean = (game: GameForTiebreaker): GameLean => ({
  _id: game.gameId,
  id: game.gameId,
  displayName: `${game.away.abbrev} @ ${game.home.abbrev}`,
  season: 2025,
  week: 1,
  sport: 'football',
  league: 'college-football',
  state: game.home.score !== null && game.away.score !== null ? 'post' : 'pre',
  completed: game.home.score !== null && game.away.score !== null,
  conferenceGame: true,
  neutralSite: false,
  venue: {
    fullName: 'Test Stadium',
    city: 'Atlanta',
    state: 'GA',
    timezone: 'America/New_York',
  },
  date: '2025-09-06T12:00Z',
  home: {
    teamId: game.home.teamId,
    abbrev: game.home.abbrev,
    displayName: game.home.abbrev,
    shortDisplayName: game.home.abbrev,
    score: game.home.score,
    rank: null,
    logo: '',
    color: '000000',
    alternateColor: '000000',
    division: game.home.division ?? null,
  },
  away: {
    teamId: game.away.teamId,
    abbrev: game.away.abbrev,
    displayName: game.away.abbrev,
    shortDisplayName: game.away.abbrev,
    score: game.away.score,
    rank: null,
    logo: '',
    color: '000000',
    alternateColor: '000000',
    division: game.away.division ?? null,
  },
  predictedScore: { home: 28, away: 24 },
  gameType: {
    name: 'Regular Season',
    abbreviation: 'reg',
  },
  odds: {
    favoriteTeamId: null,
    spread: null,
    overUnder: null,
  },
});
