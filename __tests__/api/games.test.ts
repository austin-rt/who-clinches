/**
 * API Route Tests: GET /api/games
 *
 * Tests for the games endpoint including:
 * - Response structure (GamesResponse)
 * - Required TeamMetadata fields
 * - Query parameter filtering
 * - Caching headers
 */

import { fetchAPI, validateFields } from '../setup';
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
      const requiredFields: (keyof (typeof response.teams)[0])[] = [
        'id',
        'abbrev',
        'displayName',
        'logo',
        'color',
        'alternateColor',
      ];

      response.teams.forEach((team, index) => {
        const validation = validateFields(
          team as unknown as Record<string, unknown>,
          requiredFields
        );
        if (!validation.valid) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:${team.id || 'unknown'} | ABBREV:${team.abbrev || 'unknown'} | MISSING_FIELDS:${validation.missingFields.join(',')} | REQUIRED_FIELDS:${requiredFields.join(',')}`
          );
        }
        expect(validation.valid).toBe(true);

        // Validate ID field
        if (!team.id) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:unknown | ABBREV:${team.abbrev || 'unknown'} | FIELD:id | ISSUE:missing_or_undefined | EXPECTED:non-empty_string | ACTUAL:${team.id}`
          );
        }
        if (typeof team.id !== 'string') {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:unknown | ABBREV:${team.abbrev || 'unknown'} | FIELD:id | ISSUE:wrong_type | EXPECTED:string | ACTUAL:${typeof team.id} | VALUE:${team.id}`
          );
        }
        if (team.id.length === 0) {
          throw new Error(
            `FIELD_VALIDATION_FAILED | ENTITY:TeamMetadata | INDEX:${index} | ID:unknown | ABBREV:${team.abbrev || 'unknown'} | FIELD:id | ISSUE:empty_string | EXPECTED:non-empty_string | ACTUAL:empty_string | VALUE:${team.id}`
          );
        }

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
    });
  });
});
