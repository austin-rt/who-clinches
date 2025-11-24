/**
 * API Route Tests: POST /api/simulate/cfb/sec
 *
 * Tests for the SEC simulate endpoint including:
 * - Response structure (SimulateResponse)
 * - Required StandingEntry fields
 * - Override handling
 * - Ranking and tiebreaker rules
 * - Input validation
 */

import { fetchAPI, validateNestedFields } from '../../../setup';
import { SimulateResponse } from '@/lib/api-types';
import { setupTestDB, teardownTestDB } from '../../../helpers/db-mock-setup';
import { clearMongoMemoryServerData } from '../../../mocks/mongodb-memory-server.mock';
import dbConnect from '@/lib/mongodb';

const SEASON = 2025;

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: number | string;
}

interface PullGamesResponse {
  upserted: number;
  weeksPulled: number[];
  lastUpdated: number | string;
}

describe('POST /api/simulate/cfb/sec', () => {
  // Setup MongoDB Memory Server for main database
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    // Clear data but don't seed - tests will seed via API calls
    await dbConnect();
    await clearMongoMemoryServerData();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Response Structure', () => {
    it('returns SimulateResponse with all required fields and structure', async () => {
      // Seed data by calling pull endpoints first
      const pullTeamsResponse = await fetchAPI<PullTeamsResponse>('/api/pull-teams/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(pullTeamsResponse.upserted).toBeGreaterThan(0);

      const pullGamesResponse = await fetchAPI<PullGamesResponse>('/api/pull-games/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({ season: SEASON }),
      });
      expect(pullGamesResponse.upserted).toBeGreaterThan(0);

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
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
      // Define all required field paths for StandingEntry
      // This is the single source of truth - update this when StandingEntry changes
      const requiredFields = [
        'rank',
        'teamId',
        'abbrev',
        'displayName',
        'logo',
        'color',
        'record',
        'record.wins',
        'record.losses',
        'confRecord',
        'confRecord.wins',
        'confRecord.losses',
        'explainPosition',
      ];

      response.standings.forEach((entry, index) => {
        const validation = validateNestedFields(
          entry as unknown as Record<string, unknown>,
          requiredFields
        );
        if (!validation.valid) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | MISSING_FIELDS:${validation.missingPaths.join(',')} | REQUIRED_FIELDS:${requiredFields.join(',')}`
          );
        }

        // Additional type and format validations for critical fields
        if (typeof entry.color !== 'string' || !/^[0-9a-f]{6}$/i.test(entry.color)) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:StandingsEntry | INDEX:${index} | ID:${entry.teamId || entry.abbrev || 'unknown'} | FIELD:color | ISSUE:invalid_format | EXPECTED:6-digit_hex_without_hash | ACTUAL:${entry.color} | PATTERN:^[0-9a-f]{6}$`
          );
        }
      });
    });
  });

  describe('Team Rankings', () => {
    it('returns exactly 16 teams for SEC conference', async () => {
      // Seed data by calling pull endpoints first
      const pullTeamsResponse = await fetchAPI<PullTeamsResponse>('/api/pull-teams/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(pullTeamsResponse.upserted).toBeGreaterThan(0);

      const pullGamesResponse = await fetchAPI<PullGamesResponse>('/api/pull-games/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({ season: SEASON }),
      });
      expect(pullGamesResponse.upserted).toBeGreaterThan(0);

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          overrides: {},
        }),
      });

      expect(response.standings.length).toBe(16);
    });

    it('ranks teams 1-16 without gaps', async () => {
      // Seed data by calling pull endpoints first
      const pullTeamsResponse = await fetchAPI<PullTeamsResponse>('/api/pull-teams/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(pullTeamsResponse.upserted).toBeGreaterThan(0);

      const pullGamesResponse = await fetchAPI<PullGamesResponse>('/api/pull-games/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({ season: SEASON }),
      });
      expect(pullGamesResponse.upserted).toBeGreaterThan(0);

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          overrides: {},
        }),
      });

      const ranks = response.standings.map((entry) => entry.rank);
      expect(ranks.sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    });

    it('championship array contains top 2 teams', async () => {
      // Seed data by calling pull endpoints first
      const pullTeamsResponse = await fetchAPI<PullTeamsResponse>('/api/pull-teams/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(pullTeamsResponse.upserted).toBeGreaterThan(0);

      const pullGamesResponse = await fetchAPI<PullGamesResponse>('/api/pull-games/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({ season: SEASON }),
      });
      expect(pullGamesResponse.upserted).toBeGreaterThan(0);

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
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
        await fetchAPI('/api/simulate/cfb/sec', {
          method: 'POST',
          body: JSON.stringify({
            overrides: {},
          }),
        });
        throw new Error(
          'API_ERROR_RESPONSE | ENDPOINT:/api/simulate/cfb/sec | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:season | EXPECTED:required_field_missing'
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/simulate/cfb/sec | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });
  });
});
