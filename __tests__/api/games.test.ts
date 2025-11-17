/**
 * API Route Tests: GET /api/games
 *
 * Tests for the games endpoint including:
 * - Response structure (GamesResponse)
 * - Required TeamMetadata fields
 * - Query parameter filtering
 * - Caching headers
 */

import { fetchAPI, validateNestedFields } from '../setup';
import { GamesResponse } from '@/lib/api-types';

const SEASON = 2025;
const CONFERENCE_ID = 8;

describe('GET /api/games', () => {
  describe('Response Structure', () => {
    it('returns GamesResponse with all required fields and structure', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

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

      // Check teams have all required TeamMetadata fields
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
