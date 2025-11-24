/**
 * API Route Tests: POST /api/pull-teams/cfb/[conf]
 *
 * Tests for the pull-teams endpoint including:
 * - Pulling all conference teams
 * - Color field handling
 * - Input validation
 * - Response structure
 */

import { fetchAPI, validateNestedFields } from '../../setup';
import { GamesResponse } from '@/lib/api-types';
import { SUPPORTED_SPORTS_CONFS } from '@/lib/cfb/supported-config';
import type { ConferenceSlug } from '@/lib/cfb/constants';
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
} from '../../helpers/db-mock-setup';

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: number | string;
}

// Get CFB conferences from supported config
const CFB_CONFS = SUPPORTED_SPORTS_CONFS.filter(({ sport }) => sport === 'cfb').map(
  ({ conf }) => conf as ConferenceSlug
);

describe.each(CFB_CONFS)('POST /api/pull-teams/cfb/%s', (conf) => {
  // Setup MongoDB Memory Server for main database
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Conference Pull', () => {
    it(`pulls all ${conf.toUpperCase()} teams with all required response fields`, async () => {
      const response = await fetchAPI<PullTeamsResponse>(`/api/pull-teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({}),
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
      const pullResponse = await fetchAPI<PullTeamsResponse>(`/api/pull-teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(pullResponse.upserted).toBeGreaterThan(0);

      // Then verify they're accessible via games endpoint
      const gamesResponse = await fetchAPI<GamesResponse>(`/api/games/cfb/${conf}?season=2025`);

      if (gamesResponse.teams.length > 0) {
        // Define all required field paths for TeamMetadata
        // This is the single source of truth - update this when TeamMetadata changes
        const requiredFields = ['id', 'abbrev', 'displayName', 'logo', 'color', 'alternateColor'];

        gamesResponse.teams.forEach((team, index) => {
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
      }
    }, 15000);
  });

  // Note: Input validation tests removed - sport/league/conf are now in URL path
  // No body parameters are required for pull-teams endpoint
});
