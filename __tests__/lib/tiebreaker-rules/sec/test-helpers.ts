/**
 * Shared test helpers for SEC tiebreaker rules tests
 */

import { GameLean } from '@/lib/types';

export const createMockGame = (
  espnId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number | null,
  awayScore: number | null,
  homeAbbrev: string,
  awayAbbrev: string
): GameLean => ({
  _id: espnId,
  espnId,
  displayName: `${awayAbbrev} @ ${homeAbbrev}`,
  season: 2025,
  week: 1,
  sport: 'football',
  league: 'college-football',
  state: homeScore !== null && awayScore !== null ? 'post' : 'pre',
  completed: homeScore !== null && awayScore !== null,
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
    teamEspnId: homeTeamId,
    abbrev: homeAbbrev,
    displayName: homeAbbrev,
    score: homeScore,
    rank: null,
    logo: '',
    color: '000000',
  },
  away: {
    teamEspnId: awayTeamId,
    abbrev: awayAbbrev,
    displayName: awayAbbrev,
    score: awayScore,
    rank: null,
    logo: '',
    color: '000000',
  },
  predictedScore: { home: 28, away: 24 },
  odds: {
    spread: null,
    overUnder: null,
    favoriteTeamEspnId: null,
  },
});
