import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import dbConnectTest from '../lib/mongodb-test';
import Game from '../lib/models/Game';
import Team from '../lib/models/Team';
import {
  applyOverrides,
  calculateStandings,
} from '../lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { sports } from '../lib/constants';
import { GameLean, GameState } from '../lib/types';
import { getDefaultPredictedScore } from '../lib/cfb/helpers/prefill-helpers';

const localEnvFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(localEnvFile)) {
  dotenv.config({ path: localEnvFile });
}

const payload = {
  season: 2025,
  overrides: {
    '401752783': { homeScore: 25, awayScore: 30 },
    '401752784': { homeScore: 27, awayScore: 26 },
    '401752788': { homeScore: 19, awayScore: 38 },
    '401752789': { homeScore: 24, awayScore: 13 },
    '401752791': { homeScore: 35, awayScore: 32 },
    '401752792': { homeScore: 27, awayScore: 17 },
  },
};

async function testSimulate() {
  try {
    const { season, overrides = {} } = payload;

    const sport = 'cfb';
    const conf = 'sec';

    const { conferences } = sports[sport];
    const conferenceMeta = conferences[conf];

    if (!conferenceMeta) {
      console.error('Unsupported conference: sec');
      return;
    }

    const connection = await dbConnectTest();
    // Use the test connection for models
    Game.db = connection;
    Team.db = connection;

    const conferenceTeams = await Team.find({
      conferenceId: conferenceMeta.espnId,
    })
      .lean()
      .exec();

    if (conferenceTeams.length === 0) {
      console.error('No teams found for SEC conference');
      return;
    }

    const conferenceTeamIds = new Set(conferenceTeams.map((team) => team._id));

    const allConferenceGamesRaw = await Game.find({
      season,
      conferenceGame: true,
      league: 'college-football',
    })
      .lean()
      .exec();

    const gamesRaw = allConferenceGamesRaw.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) &&
        conferenceTeamIds.has(game.away.teamEspnId)
    );

    if (gamesRaw.length === 0) {
      console.error(`No SEC conference games found for season ${season}`);
      return;
    }

    const games: GameLean[] = gamesRaw.map(
      (game): GameLean => ({
        _id: String(game._id),
        espnId: String(game.espnId),
        displayName: String(game.displayName),
        date: String(game.date),
        week: typeof game.week === 'number' ? game.week : null,
        season: Number(game.season),
        sport: String(game.sport),
        league: String(game.league),
        state: game.state as GameState,
        completed: Boolean(game.completed),
        conferenceGame: Boolean(game.conferenceGame),
        neutralSite: Boolean(game.neutralSite),
        venue: {
          fullName: String(game.venue?.fullName || ''),
          city: String(game.venue?.city || ''),
          state: String(game.venue?.state || ''),
          timezone: String(game.venue?.timezone || 'America/New_York'),
        },
        home: {
          teamEspnId: String(game.home?.teamEspnId || ''),
          abbrev: String(game.home?.abbrev || ''),
          displayName: game.home?.displayName || game.home?.abbrev || '',
          shortDisplayName: game.home?.shortDisplayName || game.home?.displayName || game.home?.abbrev || '',
          logo: game.home?.logo || '',
          color: game.home?.color || '000000',
          alternateColor: game.home?.alternateColor || '000000',
          score: typeof game.home?.score === 'number' ? game.home.score : null,
          rank: typeof game.home?.rank === 'number' ? game.home.rank : null,
        },
        away: {
          teamEspnId: String(game.away?.teamEspnId || ''),
          abbrev: String(game.away?.abbrev || ''),
          displayName: game.away?.displayName || game.away?.abbrev || '',
          shortDisplayName: game.away?.shortDisplayName || game.away?.displayName || game.away?.abbrev || '',
          logo: game.away?.logo || '',
          color: game.away?.color || '000000',
          alternateColor: game.away?.alternateColor || '000000',
          score: typeof game.away?.score === 'number' ? game.away.score : null,
          rank: typeof game.away?.rank === 'number' ? game.away.rank : null,
        },
        odds: {
          favoriteTeamEspnId: game.odds?.favoriteTeamEspnId
            ? String(game.odds.favoriteTeamEspnId)
            : null,
          spread: typeof game.odds?.spread === 'number' ? game.odds.spread : null,
          overUnder: typeof game.odds?.overUnder === 'number' ? game.odds.overUnder : null,
        },
        predictedScore: game.predictedScore
          ? {
              home: Number(game.predictedScore?.home || 0),
              away: Number(game.predictedScore?.away || 0),
            }
          : getDefaultPredictedScore(),
      })
    );

    const finalGames = applyOverrides(games, overrides);

    const teamSet = new Set<string>();
    for (const game of finalGames) {
      if (conferenceTeamIds.has(game.home.teamEspnId)) {
        teamSet.add(game.home.teamEspnId);
      }
      if (conferenceTeamIds.has(game.away.teamEspnId)) {
        teamSet.add(game.away.teamEspnId);
      }
    }
    const allTeams = Array.from(teamSet);

    const conferenceGamesOnly = finalGames.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) &&
        conferenceTeamIds.has(game.away.teamEspnId)
    );

    console.log('=== STARTING SIMULATE CALCULATION ===\n');
    const { standings, tieLogs } = calculateStandings(conferenceGamesOnly, allTeams);

    console.log('\n=== FINAL STANDINGS ===');
    standings.forEach((standing) => {
      console.log(
        `${standing.rank}. ${standing.abbrev} (${standing.confRecord.wins}-${standing.confRecord.losses}) - ${standing.explainPosition}`
      );
    });

    console.log('\n=== TIE LOGS ===');
    tieLogs.forEach((tieLog, index) => {
      console.log(`\nTie ${index + 1} - Teams: ${tieLog.teams.join(', ')}`);
      tieLog.steps.forEach((step) => {
        console.log(`  Rule ${step.rule}: ${step.detail}`);
        console.log(`  Survivors: ${step.survivors.join(', ')}`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

void testSimulate();

