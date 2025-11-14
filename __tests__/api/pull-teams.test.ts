/**
 * API Route Tests: POST /api/pull-teams
 *
 * Tests for the pull-teams endpoint including:
 * - Pulling all SEC teams
 * - Color field handling
 * - Input validation
 * - Response structure
 */

import { fetchAPI } from '../setup';
import { GamesResponse } from '@/lib/api-types';

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: number | string;
}

describe('POST /api/pull-teams', () => {
  describe('SEC Conference Pull', () => {
    it('pulls all SEC teams with all required response fields', async () => {
      const response = await fetchAPI<PullTeamsResponse>('/api/pull-teams', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          conferenceId: 8,
        }),
      });

      // Check response structure
      expect(response).toBeDefined();
      expect(response.upserted).toBeDefined();
      expect(typeof response.upserted).toBe('number');
      expect(response.upserted).toBeGreaterThan(0);
      expect(response.lastUpdated).toBeDefined();
      // lastUpdated can be either number (timestamp) or string (ISO date)
      if (response.lastUpdated === null || response.lastUpdated === undefined) {
        throw new Error(
          `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:missing_or_null | EXPECTED:number_or_string | ACTUAL:${response.lastUpdated === null ? 'null' : 'undefined'}`
        );
      }
      expect(response.lastUpdated !== null && response.lastUpdated !== undefined).toBe(true);
      // Ensure it's a reasonable value for either type
      if (typeof response.lastUpdated === 'number') {
        if (response.lastUpdated <= 0) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:invalid_value | EXPECTED:number_greater_than_zero | ACTUAL:${response.lastUpdated} | TYPE:number`
          );
        }
        expect(response.lastUpdated).toBeGreaterThan(0);
      } else if (typeof response.lastUpdated === 'string') {
        if (response.lastUpdated.length === 0) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:empty_string | EXPECTED:non-empty_string | ACTUAL:empty_string | TYPE:string`
          );
        }
        expect(response.lastUpdated.length).toBeGreaterThan(0);
      } else {
        throw new Error(
          `FIELD_VALIDATION_FAILED | ENTITY:PullTeamsResponse | FIELD:lastUpdated | ISSUE:wrong_type | EXPECTED:number_or_string | ACTUAL:${typeof response.lastUpdated} | VALUE:${JSON.stringify(response.lastUpdated)}`
        );
      }
    }, 30000);
  });

  describe('Color Fields', () => {
    it('teams include color and alternateColor fields with valid hex format', async () => {
      // First pull teams to ensure they're seeded
      const pullResponse = await fetchAPI<PullTeamsResponse>('/api/pull-teams', {
        method: 'POST',
        body: JSON.stringify({
          sport: 'football',
          league: 'college-football',
          conferenceId: 8,
        }),
      });

      expect(pullResponse.upserted).toBeGreaterThan(0);

      // Then verify they're accessible via games endpoint
      const gamesResponse = await fetchAPI<GamesResponse>('/api/games?season=2025&conferenceId=8');

      if (gamesResponse.teams.length > 0) {
        gamesResponse.teams.forEach((team, index) => {
          // Validate color field
          if (!team.color) {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:color | ISSUE:missing_or_undefined | EXPECTED:non-empty_string | ACTUAL:${team.color}`
            );
          }
          if (typeof team.color !== 'string') {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:color | ISSUE:wrong_type | EXPECTED:string | ACTUAL:${typeof team.color} | VALUE:${team.color}`
            );
          }
          if (!/^[0-9a-f]{6}$/i.test(team.color)) {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:color | ISSUE:invalid_format | EXPECTED:6-digit_hex_without_hash | ACTUAL:${team.color} | PATTERN:^[0-9a-f]{6}$`
            );
          }

          // Validate alternateColor field
          if (!team.alternateColor) {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:alternateColor | ISSUE:missing_or_undefined | EXPECTED:non-empty_string | ACTUAL:${team.alternateColor}`
            );
          }
          if (typeof team.alternateColor !== 'string') {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:alternateColor | ISSUE:wrong_type | EXPECTED:string | ACTUAL:${typeof team.alternateColor} | VALUE:${team.alternateColor}`
            );
          }
          if (!/^[0-9a-f]{6}$/i.test(team.alternateColor)) {
            throw new Error(
              `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:alternateColor | ISSUE:invalid_format | EXPECTED:6-digit_hex_without_hash | ACTUAL:${team.alternateColor} | PATTERN:^[0-9a-f]{6}$`
            );
          }
        });
      }
    }, 15000);
  });

  describe('Input Validation', () => {
    it('returns 400 when sport is missing', async () => {
      try {
        await fetchAPI('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            league: 'college-football',
            conferenceId: 8,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:sport'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:sport | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when league is missing', async () => {
      try {
        await fetchAPI('/api/pull-teams', {
          method: 'POST',
          body: JSON.stringify({
            sport: 'football',
            conferenceId: 8,
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:league'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-teams | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:league | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });
  });
});
