import { GameLean } from '@/lib/types';

interface GameForTiebreaker {
  gameId: string;
  home: {
    teamId: string;
    score: number | null;
    abbrev: string;
  };
  away: {
    teamId: string;
    score: number | null;
    abbrev: string;
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
    score: game.home.score,
    rank: null,
    logo: '',
    color: '000000',
    shortDisplayName: game.home.abbrev,
    alternateColor: '000000',
  },
  away: {
    teamId: game.away.teamId,
    abbrev: game.away.abbrev,
    displayName: game.away.abbrev,
    score: game.away.score,
    rank: null,
    logo: '',
    color: '000000',
    shortDisplayName: game.away.abbrev,
    alternateColor: '000000',
  },
  predictedScore: { home: 28, away: 24 },
  gameType: {
    name: 'Regular Season',
    abbreviation: 'reg',
  },
  odds: {
    spread: null,
    overUnder: null,
    favoriteTeamId: null,
  },
});
