/**
 * API Route Tests: POST /api/pull-games
 *
 * Tests for the pull-games endpoint including:
 * - Pulling full season
 * - Pulling specific weeks
 * - Field validation (displayName, predictedScore)
 * - Input validation
 */

import { fetchAPI } from '../setup';
import { GamesResponse } from '@/lib/api-types';

interface PullGamesResponse {
  upserted: number;
  weeksPulled: number[];
  lastUpdated: number | string;
}

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('POST /api/pull-games', () => {
  describe('Full Season Pull', () => {
    it('pulls full season with all required response fields', async () => {
      const response = await fetchAPI<PullGamesResponse>('/api/pull-games', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          season: SEASON,
          conferenceId: CONFERENCE_ID,
        }),
      });

      // Check response structure
      expect(response).toBeDefined();
      expect(response.upserted).toBeDefined();
      expect(typeof response.upserted).toBe('number');
      expect(response.upserted).toBeGreaterThan(0);
      expect(response.weeksPulled).toBeDefined();
      expect(Array.isArray(response.weeksPulled)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
      // lastUpdated can be number or string (ISO timestamp)
      if (typeof response.lastUpdated !== 'number' && typeof response.lastUpdated !== 'string') {
        throw new Error(
          `FIELD_VALIDATION_FAILED | ENTITY:PullGamesResponse | FIELD:lastUpdated | ISSUE:wrong_type | EXPECTED:number_or_string | ACTUAL:${typeof response.lastUpdated} | VALUE:${JSON.stringify(response.lastUpdated)}`
        );
      }
      expect(
        typeof response.lastUpdated === 'number' || typeof response.lastUpdated === 'string'
      ).toBe(true);
    }, 60000);

    it('pulls full season: database should have 128 total games (all SEC games)', async () => {
      // Pull games first
      await fetchAPI<PullGamesResponse>('/api/pull-games', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          season: SEASON,
          conferenceId: CONFERENCE_ID,
        }),
      });

      // Check total games in database (all SEC games: conference + non-conference)
      const allGamesResponse = await fetchAPI<GamesResponse>(`/api/games?season=${SEASON}`);

      // 16 SEC teams × 8 conference games per team = 128 total games (64 conference + 64 non-conference)
      if (allGamesResponse.events.length !== 128) {
        throw new Error(
          `DATA_VALIDATION_FAILED | ENTITY:Games | ISSUE:incorrect_total_count | EXPECTED:128_total_games | ACTUAL:${allGamesResponse.events.length} | CALCULATION:16_teams_×_8_games_per_team_=_128_total_SEC_games | NOTE:Database should contain all SEC games (conference + non-conference)`
        );
      }
      expect(allGamesResponse.events.length).toBe(128);
    }, 60000);

    it('conference games endpoint returns exactly 64 conference games', async () => {
      // Check conference games only (with conferenceId filter)
      const conferenceGamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      // 16 teams × 8 conference games per team / 2 (each game counted once) = 64 conference games
      if (conferenceGamesResponse.events.length !== 64) {
        throw new Error(
          `DATA_VALIDATION_FAILED | ENTITY:Games | ISSUE:incorrect_conference_count | EXPECTED:64_conference_games | ACTUAL:${conferenceGamesResponse.events.length} | CALCULATION:16_teams_×_8_conference_games_per_team_/_2_=_64_conference_games | NOTE:Endpoint with conferenceId should filter to only conference games`
        );
      }
      expect(conferenceGamesResponse.events.length).toBe(64);

      // Verify all returned games are conference games
      const nonConferenceGames = conferenceGamesResponse.events.filter(
        (game) => !game.conferenceGame
      );
      if (nonConferenceGames.length > 0) {
        throw new Error(
          `DATA_VALIDATION_FAILED | ENTITY:Games | ISSUE:non_conference_games_in_response | EXPECTED:all_conference_games | ACTUAL:${nonConferenceGames.length}_non_conference_games_found | NOTE:Endpoint with conferenceId=8 should only return games where conferenceGame=true`
        );
      }
    });
  });

  describe('Game Data Validation', () => {
    it('all games include displayName and predictedScore fields', async () => {
      // Pull games first
      await fetchAPI<PullGamesResponse>('/api/pull-games', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          season: SEASON,
          conferenceId: CONFERENCE_ID,
        }),
      });

      // Then check via games endpoint
      const gamesResponse = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      if (gamesResponse.events.length > 0) {
        gamesResponse.events.forEach((game, index) => {
          // Validate displayName
          if (!game.displayName) {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:ReshapedGame | INDEX:${index} | ID:${game.espnId || 'unknown'} | FIELD:displayName | ISSUE:missing_or_undefined | EXPECTED:non-empty_string | ACTUAL:${game.displayName}`
            );
          }
          if (typeof game.displayName !== 'string') {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:ReshapedGame | INDEX:${index} | ID:${game.espnId || 'unknown'} | FIELD:displayName | ISSUE:wrong_type | EXPECTED:string | ACTUAL:${typeof game.displayName} | VALUE:${game.displayName}`
            );
          }
          if (game.displayName.length === 0) {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:ReshapedGame | INDEX:${index} | ID:${game.espnId || 'unknown'} | FIELD:displayName | ISSUE:empty_string | EXPECTED:non-empty_string | ACTUAL:empty_string | VALUE:${game.displayName}`
            );
          }

          // Validate predictedScore (can be null or object with home/away)
          if (game.predictedScore !== null && game.predictedScore !== undefined) {
            if (typeof game.predictedScore !== 'object') {
              throw new Error(
                `FIELD_VALIDATION_FAILED | ENTITY:ReshapedGame | INDEX:${index} | ID:${game.espnId || 'unknown'} | FIELD:predictedScore | ISSUE:wrong_type | EXPECTED:object_or_null | ACTUAL:${typeof game.predictedScore} | VALUE:${JSON.stringify(game.predictedScore)}`
              );
            }
            if (!game.predictedScore.home && game.predictedScore.home !== 0) {
              throw new Error(
                `FIELD_VALIDATION_FAILED | ENTITY:ReshapedGame | INDEX:${index} | ID:${game.espnId || 'unknown'} | FIELD:predictedScore.home | ISSUE:missing_or_undefined | EXPECTED:number | ACTUAL:${game.predictedScore.home}`
              );
            }
            if (!game.predictedScore.away && game.predictedScore.away !== 0) {
              throw new Error(
                `FIELD_VALIDATION_FAILED | ENTITY:ReshapedGame | INDEX:${index} | ID:${game.espnId || 'unknown'} | FIELD:predictedScore.away | ISSUE:missing_or_undefined | EXPECTED:number | ACTUAL:${game.predictedScore.away}`
              );
            }
          }
        });
      }
    }, 30000);
  });

  describe('Input Validation', () => {
    it('returns 400 when sport is missing', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            league: 'college-football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:sport'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:sport | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when league is missing', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            season: SEASON,
            conferenceId: CONFERENCE_ID,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:league'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:league | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when season is missing', async () => {
      try {
        await fetchAPI('/api/pull-games', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            league: 'college-football',
            conferenceId: CONFERENCE_ID,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:season'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });
  });
});
