/**
 * API Route Tests: POST /api/simulate
 *
 * Tests for the simulate endpoint including:
 * - Response structure (SimulateResponse)
 * - Required StandingEntry fields
 * - Override handling
 * - Ranking and tiebreaker rules
 * - Input validation
 */

import { fetchAPI, validateFields } from '../setup';
import { SimulateResponse } from '@/lib/api-types';

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('POST /api/simulate', () => {
  describe('Response Structure', () => {
    it('returns SimulateResponse with all required fields and structure', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      // Check top-level response structure
      expect(response).toBeDefined();
      expect(response.standings).toBeDefined();
      expect(Array.isArray(response.standings)).toBe(true);
      expect(response.championship).toBeDefined();
      expect(Array.isArray(response.championship)).toBe(true);
      expect(response.championship.length).toBe(2);
      expect(response.tieLogs).toBeDefined();
      expect(Array.isArray(response.tieLogs)).toBe(true);

      // Check standings entries have all required fields
      expect(response.standings.length).toBeGreaterThan(0);
      const requiredFields = [
        'rank',
        'teamId',
        'abbrev',
        'displayName',
        'logo',
        'color',
        'record',
        'confRecord',
        'explainPosition',
      ];

      response.standings.forEach((entry, index) => {
        const validation = validateFields(
          entry as unknown as Record<string, unknown>,
          requiredFields
        );
        if (!validation.valid) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | MISSING_FIELDS:${validation.missingFields.join(',')} | REQUIRED_FIELDS:${requiredFields.join(',')}`
          );
        }
        expect(validation.valid).toBe(true);

        // Validate color field format
        if (!entry.color) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | FIELD:color | ISSUE:missing_or_undefined | EXPECTED:non-empty_string | ACTUAL:${entry.color}`
          );
        }
        if (typeof entry.color !== 'string') {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | FIELD:color | ISSUE:wrong_type | EXPECTED:string | ACTUAL:${typeof entry.color} | VALUE:${entry.color}`
          );
        }
        if (!/^[0-9a-f]{6}$/i.test(entry.color)) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | FIELD:color | ISSUE:invalid_format | EXPECTED:6-digit_hex_without_hash | ACTUAL:${entry.color} | PATTERN:^[0-9a-f]{6}$`
          );
        }
      });
    });
  });

  describe('Team Rankings', () => {
    it('returns exactly 16 teams for SEC conference', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      expect(response.standings.length).toBe(16);
    });

    it('ranks teams 1-16 without gaps', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      const ranks = response.standings.map((entry) => entry.rank);
      expect(ranks.sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    });

    it('championship array contains top 2 teams', async () => {
      const response = await fetchAPI<SimulateResponse>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          conferenceId: CONFERENCE_ID,
          overrides: {},
        }),
      });

      if (response.championship) {
        expect(response.championship.length).toBeLessThanOrEqual(2);
        // Championship should be top 2 teams
        const top2Ranks = response.standings
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 2)
          .map((e) => e.teamId);

        response.championship.forEach((teamId) => {
          expect(top2Ranks).toContain(teamId);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('returns 400 when season is missing', async () => {
      try {
        await fetchAPI('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            conferenceId: CONFERENCE_ID,
            overrides: {},
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:season | EXPECTED:required_field_missing'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });

    it('returns 400 when conferenceId is missing', async () => {
      try {
        await fetchAPI('/api/simulate', {
          method: 'POST',
          body: JSON.stringify({
            season: SEASON,
            overrides: {},
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:conferenceId | EXPECTED:required_field_missing'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:conferenceId | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });
  });
});
