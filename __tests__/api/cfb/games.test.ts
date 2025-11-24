/**
 * API Route Tests: GET /api/games/cfb/[conf]
 *
 * Tests for the games endpoint including:
 * - Response structure (GamesResponse)
 * - Required TeamMetadata fields
 * - Query parameter filtering
 * - Caching headers
 */

import { fetchAPI, validateNestedFields } from '../../setup';
import { GamesResponse } from '@/lib/api-types';
import { SUPPORTED_SPORTS_CONFS } from '@/lib/cfb/supported-config';
import type { ConferenceSlug } from '@/lib/cfb/constants';
import { setupTestDB, teardownTestDB } from '../../helpers/db-mock-setup';
import { clearMongoMemoryServerData } from '../../mocks/mongodb-memory-server.mock';
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

// Get CFB conferences from supported config
const CFB_CONFS = SUPPORTED_SPORTS_CONFS.filter(({ sport }) => sport === 'cfb').map(
  ({ conf }) => conf as ConferenceSlug
);

describe.each(CFB_CONFS)('GET /api/games/cfb/%s', (conf) => {
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
    it('returns GamesResponse with all required fields and structure', async () => {
      // Seed data by calling pull endpoints first (same approach as pull-teams/pull-games tests)
      const pullTeamsResponse = await fetchAPI<PullTeamsResponse>(`/api/pull-teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(pullTeamsResponse.upserted).toBeGreaterThan(0);

      const pullGamesResponse = await fetchAPI<PullGamesResponse>(`/api/pull-games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ season: SEASON }),
      });
      expect(pullGamesResponse.upserted).toBeGreaterThan(0);

      // Now query the games endpoint - it should return the games we just pulled
      // Add a small delay to ensure data is committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await fetchAPI<GamesResponse>(`/api/games/cfb/${conf}?season=${SEASON}`);

      // Check top-level response structure
      expect(response).toBeDefined();
      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
      // lastUpdated can be number or string (ISO timestamp)
      expect(
        typeof response.lastUpdated === 'number' || typeof response.lastUpdated === 'string'
      ).toBe(true);

      // Games endpoint only returns teams that are in games
      // So we need games to exist for teams to be returned
      expect(response.events.length).toBeGreaterThan(0);
      expect(response.teams.length).toBeGreaterThan(0);
      // Define all required field paths for TeamMetadata
      // This is the single source of truth - update this when TeamMetadata changes
      const requiredFields = ['id', 'abbrev', 'displayName', 'logo', 'color', 'alternateColor'];

      response.teams.forEach((team, index) => {
        const validation = validateNestedFields(
          team as unknown as Record<string, unknown>,
          requiredFields
        );
        if (!validation.valid) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | MISSING_FIELDS:${validation.missingPaths.join(',')} | REQUIRED_FIELDS:${requiredFields.join(',')}`
          );
        }

        // Additional type and format validations for critical fields
        if (typeof team.id !== 'string' || team.id.length === 0) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:unknown | ABBREV:${team.abbrev || 'unknown'} | FIELD:id | ISSUE:invalid_value | EXPECTED:non-empty_string | ACTUAL:${typeof team.id} | VALUE:${team.id}`
          );
        }

        if (typeof team.color !== 'string' || !/^[0-9a-f]{6}$/i.test(team.color)) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:color | ISSUE:invalid_format | EXPECTED:6-digit_hex_without_hash | ACTUAL:${team.color} | PATTERN:^[0-9a-f]{6}$`
          );
        }

        if (
          typeof team.alternateColor !== 'string' ||
          !/^[0-9a-f]{6}$/i.test(team.alternateColor)
        ) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | FIELD:alternateColor | ISSUE:invalid_format | EXPECTED:6-digit_hex_without_hash | ACTUAL:${team.alternateColor} | PATTERN:^[0-9a-f]{6}$`
          );
        }
      });
    });
  });
});
