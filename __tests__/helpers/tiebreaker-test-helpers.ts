import { GameLean } from '@/lib/types';

export interface MockGameOptions {
  espnId: string;
  homeTeamEspnId: string;
  awayTeamEspnId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeAbbrev?: string;
  awayAbbrev?: string;
  season?: number;
  week?: number | null;
  completed?: boolean;
}

export const createMockGame = (options: MockGameOptions): GameLean => {
  const {
    espnId,
    homeTeamEspnId,
    awayTeamEspnId,
    homeScore = null,
    awayScore = null,
    homeAbbrev = 'HOME',
    awayAbbrev = 'AWAY',
    season = 2025,
    week = null,
    completed = false,
  } = options;

  return {
    _id: `game-${espnId}`,
    espnId,
    displayName: `${homeAbbrev} vs ${awayAbbrev}`,
    date: new Date().toISOString(),
    week,
    season,
    sport: 'football',
    league: 'college-football',
    state: completed ? 'post' : 'pre',
    completed,
    conferenceGame: true,
    neutralSite: false,
    venue: {
      fullName: 'Test Stadium',
      city: 'Test City',
      state: 'TS',
      timezone: 'America/New_York',
    },
    home: {
      teamEspnId: homeTeamEspnId,
      abbrev: homeAbbrev,
      displayName: `${homeAbbrev} Team`,
      shortDisplayName: homeAbbrev,
      logo: '',
      color: '000000',
      alternateColor: 'FFFFFF',
      score: homeScore,
      rank: null,
    },
    away: {
      teamEspnId: awayTeamEspnId,
      abbrev: awayAbbrev,
      displayName: `${awayAbbrev} Team`,
      shortDisplayName: awayAbbrev,
      logo: '',
      color: '000000',
      alternateColor: 'FFFFFF',
      score: awayScore,
      rank: null,
    },
    odds: {
      favoriteTeamEspnId: null,
      spread: null,
      overUnder: null,
    },
    predictedScore: {
      home: homeScore ?? 0,
      away: awayScore ?? 0,
    },
  };
};

export const createMockGames = (games: MockGameOptions[]): GameLean[] => {
  return games.map(createMockGame);
};

