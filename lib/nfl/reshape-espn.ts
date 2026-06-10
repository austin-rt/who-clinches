import type { Event, Competition, Competitor } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { GameState } from '@/lib/types';
import type { NflGame, NflTeam, GameOdds, PredictedScore, GameVenue } from './types';
import { NFL_TEAM_BY_ESPN_ID } from './constants';
import {
  calculatePredictedScoreFromOdds,
  getDefaultPredictedScore,
} from '@/lib/cfb/helpers/prefill-helpers';

interface EspnOddsProvider {
  details?: string;
  overUnder?: number;
  spread?: number;
  awayTeamOdds?: { favorite?: boolean; team?: { id?: string } };
  homeTeamOdds?: { favorite?: boolean; team?: { id?: string } };
}

type CompetitionWithOdds = Competition & {
  odds?: EspnOddsProvider[];
};

const mapGameState = (espnState: string): GameState => {
  if (espnState === 'post') return 'post';
  if (espnState === 'in') return 'in';
  return 'pre';
};

const getCompetitor = (
  competitors: Competitor[],
  homeAway: 'home' | 'away'
): Competitor | undefined => competitors.find((c) => c.homeAway === homeAway);

const extractOdds = (competition: CompetitionWithOdds, homeTeamId: string): GameOdds => {
  const nullOdds: GameOdds = {
    favoriteTeamId: null,
    spread: null,
    overUnder: null,
  };

  if (!competition.odds || competition.odds.length === 0) return nullOdds;

  const provider = competition.odds[0];
  const spread = provider.spread ?? null;
  const overUnder = provider.overUnder ?? null;

  let favoriteTeamId: string | null = null;
  if (provider.homeTeamOdds?.favorite) {
    favoriteTeamId = homeTeamId;
  } else if (provider.awayTeamOdds?.favorite) {
    const awayComp = getCompetitor(competition.competitors, 'away');
    favoriteTeamId = awayComp?.team.id ?? null;
  } else if (spread !== null) {
    if (spread < 0) {
      favoriteTeamId = homeTeamId;
    } else if (spread > 0) {
      const awayComp = getCompetitor(competition.competitors, 'away');
      favoriteTeamId = awayComp?.team.id ?? null;
    }
  }

  return { favoriteTeamId, spread, overUnder };
};

const extractVenue = (competition: Competition): GameVenue => {
  const venue = competition.venue;
  if (!venue) {
    return { fullName: 'TBD', city: '', state: '', timezone: 'America/New_York' };
  }
  return {
    fullName: venue.fullName || 'TBD',
    city: venue.address?.city || '',
    state: venue.address?.state || '',
    timezone: 'America/New_York',
  };
};

const buildPredictedScore = (
  homeScore: number | null,
  awayScore: number | null,
  odds: GameOdds,
  homeTeamId: string
): PredictedScore => {
  if (homeScore !== null && awayScore !== null) {
    return { home: homeScore, away: awayScore };
  }

  const fromOdds = calculatePredictedScoreFromOdds(
    odds.overUnder,
    odds.spread,
    odds.favoriteTeamId,
    homeTeamId
  );
  return fromOdds || getDefaultPredictedScore();
};

export const reshapeEspnGames = (events: Event[], season: number): NflGame[] =>
  events
    .map((event) => {
      const competition = event.competitions[0] as CompetitionWithOdds | undefined;
      if (!competition) return null;

      const homeComp = getCompetitor(competition.competitors, 'home');
      const awayComp = getCompetitor(competition.competitors, 'away');
      if (!homeComp || !awayComp) return null;

      const homeTeamMeta = NFL_TEAM_BY_ESPN_ID.get(homeComp.team.id);
      const awayTeamMeta = NFL_TEAM_BY_ESPN_ID.get(awayComp.team.id);

      const state = mapGameState(event.status.type.state);
      const completed = event.status.type.completed;

      const homeScore = completed || state === 'in' ? Number(homeComp.score) || 0 : null;
      const awayScore = completed || state === 'in' ? Number(awayComp.score) || 0 : null;

      const odds = extractOdds(competition, homeComp.team.id);
      const predictedScore = buildPredictedScore(homeScore, awayScore, odds, homeComp.team.id);
      const venue = extractVenue(competition);

      const conferenceGame =
        homeTeamMeta && awayTeamMeta
          ? homeTeamMeta.conference === awayTeamMeta.conference
          : competition.conferenceCompetition;

      const divisionGame =
        homeTeamMeta && awayTeamMeta ? homeTeamMeta.divisionId === awayTeamMeta.divisionId : false;

      const game: NflGame = {
        _id: event.id,
        id: event.id,
        displayName: event.name || `${awayComp.team.displayName} at ${homeComp.team.displayName}`,
        date: event.date,
        week: event.week?.number ?? null,
        season,
        sport: 'nfl',
        league: 'nfl',
        state,
        completed,
        conferenceGame,
        divisionGame,
        neutralSite: competition.neutralSite,
        venue,
        home: {
          teamId: homeComp.team.id,
          abbrev: homeComp.team.abbreviation,
          displayName: homeComp.team.displayName,
          shortDisplayName: homeComp.team.shortDisplayName,
          logo: homeComp.team.logo || '',
          color: homeComp.team.color || '000000',
          alternateColor: homeComp.team.alternateColor || '000000',
          score: homeScore,
          rank: null,
          division: homeTeamMeta?.divisionId ?? null,
        },
        away: {
          teamId: awayComp.team.id,
          abbrev: awayComp.team.abbreviation,
          displayName: awayComp.team.displayName,
          shortDisplayName: awayComp.team.shortDisplayName,
          logo: awayComp.team.logo || '',
          color: awayComp.team.color || '000000',
          alternateColor: awayComp.team.alternateColor || '000000',
          score: awayScore,
          rank: null,
          division: awayTeamMeta?.divisionId ?? null,
        },
        odds,
        predictedScore,
      };
      return game;
    })
    .filter((g): g is NflGame => g !== null);

export const reshapeEspnTeams = (teamsData: EspnTeamsGenerated): NflTeam[] => {
  const league = teamsData.sports?.[0]?.leagues?.[0];
  if (!league) return [];

  return league.teams
    .map(({ team }) => {
      const meta = NFL_TEAM_BY_ESPN_ID.get(team.id);
      if (!meta) return null;

      const logo = team.logos?.[0]?.href || '';

      const nflTeam: NflTeam = {
        _id: team.id,
        name: team.name,
        displayName: team.displayName,
        shortDisplayName: team.shortDisplayName,
        abbreviation: team.abbreviation,
        logo,
        color: team.color || '000000',
        alternateColor: team.alternateColor || '000000',
        conferenceId: meta.conference,
        division: meta.divisionId,
        mascot: team.name,
        record: {
          overall: '',
          conference: '',
          home: '',
          away: '',
          stats: {},
        },
        conferenceStanding: '',
      };
      return nflTeam;
    })
    .filter((t): t is NflTeam => t !== null);
};
