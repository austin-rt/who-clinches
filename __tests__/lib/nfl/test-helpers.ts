import type { Game, GameOdds, PredictedScore, GameVenue } from '@/lib/types';

let gameIdCounter = 1;

export const resetGameIdCounter = (): void => {
  gameIdCounter = 1;
};

const defaultVenue: GameVenue = {
  fullName: 'Test Stadium',
  city: 'Test City',
  state: 'TS',
  timezone: 'America/New_York',
};

const defaultOdds: GameOdds = {
  favoriteTeamId: null,
  spread: null,
  overUnder: null,
};

const defaultPredicted: PredictedScore = { home: 24, away: 21 };

export const createNflGame = (overrides: {
  homeId: string;
  homeAbbrev: string;
  awayId: string;
  awayAbbrev: string;
  homeScore: number | null;
  awayScore: number | null;
  homeDivision?: string | null;
  awayDivision?: string | null;
  conferenceGame?: boolean;
  completed?: boolean;
}): Game => {
  const id = String(gameIdCounter++);
  return {
    _id: id,
    id,
    displayName: `${overrides.awayAbbrev} at ${overrides.homeAbbrev}`,
    date: '2024-09-08T13:00:00Z',
    week: 1,
    season: 2024,
    sport: 'nfl',
    league: 'nfl',
    state: overrides.completed !== false ? 'post' : 'pre',
    completed: overrides.completed !== false,
    conferenceGame: overrides.conferenceGame ?? true,
    neutralSite: false,
    venue: defaultVenue,
    home: {
      teamId: overrides.homeId,
      abbrev: overrides.homeAbbrev,
      displayName: overrides.homeAbbrev,
      shortDisplayName: overrides.homeAbbrev,
      logo: '',
      color: '000000',
      alternateColor: '000000',
      score: overrides.homeScore,
      rank: null,
      division: overrides.homeDivision ?? null,
    },
    away: {
      teamId: overrides.awayId,
      abbrev: overrides.awayAbbrev,
      displayName: overrides.awayAbbrev,
      shortDisplayName: overrides.awayAbbrev,
      logo: '',
      color: '000000',
      alternateColor: '000000',
      score: overrides.awayScore,
      rank: null,
      division: overrides.awayDivision ?? null,
    },
    odds: defaultOdds,
    predictedScore: defaultPredicted,
  };
};
