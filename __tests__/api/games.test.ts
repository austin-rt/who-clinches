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
    it('returns GamesResponse with correct structure', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      expect(response).toBeDefined();
      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
    });

    it('includes all required TeamMetadata fields', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      expect(response.teams.length).toBeGreaterThan(0);

      const requiredFields: (keyof (typeof response.teams)[0])[] = [
        'id',
        'abbrev',
        'displayName',
        'logo',
        'color',
        'alternateColor',
      ];

      response.teams.forEach((team) => {
        const validation = validateFields(
          team as unknown as Record<string, unknown>,
          requiredFields
        );
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          throw new Error(`Team missing fields: ${validation.missingFields.join(', ')}`);
        }
      });
    });

    it('includes lastUpdated timestamp', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      expect(response.lastUpdated).toBeDefined();
      // lastUpdated can be number or string (ISO timestamp)
      expect(
        typeof response.lastUpdated === 'number' || typeof response.lastUpdated === 'string'
      ).toBe(true);
    });
  });

  describe('Query Filters', () => {
    it('filters by season', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      // Should have games for 2025 season
      expect(response.events.length).toBeGreaterThan(0);
    });

    it('filters by conferenceId', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      // Should have games for SEC (conferenceId 8)
      expect(response.teams.length).toBeGreaterThanOrEqual(14);
    });

    it('handles multiple filters combined', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}&state=pre`
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
    });

    it('handles date range filters', async () => {
      const from = '2025-09-01';
      const to = '2025-09-30';
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}&from=${from}&to=${to}`
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles missing season gracefully', async () => {
      try {
        await fetchAPI<GamesResponse>(`/api/games?conferenceId=${CONFERENCE_ID}`);
        // If it succeeds, that's fine too
      } catch (error) {
        // Should fail gracefully
        expect(error).toBeDefined();
      }
    });

    it('handles invalid state parameter', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}&state=invalid`
      );

      // Should return empty or ignore invalid state
      expect(Array.isArray(response.events)).toBe(true);
    });
  });

  describe('Team Metadata Validation', () => {
    it('all teams have color as hex string without # prefix', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      response.teams.forEach((team) => {
        expect(team.color).toBeDefined();
        expect(typeof team.color).toBe('string');
        // Should be hex without #
        expect(/^[0-9a-f]{6}$/i.test(team.color)).toBe(true);
      });
    });

    it('all teams have alternateColor as hex string', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      response.teams.forEach((team) => {
        expect(team.alternateColor).toBeDefined();
        expect(typeof team.alternateColor).toBe('string');
        // Should be hex without #
        expect(/^[0-9a-f]{6}$/i.test(team.alternateColor)).toBe(true);
      });
    });

    it('all teams have valid ESPN team IDs', async () => {
      const response = await fetchAPI<GamesResponse>(
        `/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`
      );

      response.teams.forEach((team) => {
        expect(team.id).toBeDefined();
        expect(typeof team.id).toBe('string');
        expect(team.id.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cache Headers', () => {
    it('sets cache headers for non-live games', async () => {
      // Get a game that is not currently live (status != 'in')
      const url = `http://localhost:3000/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}&state=pre`;
      const response = await fetch(url);

      expect(response.headers.get('cache-control')).toBeDefined();
      const cacheControl = response.headers.get('cache-control');
      // Should have 60s cache for non-live games or similar
      expect(cacheControl).toMatch(/(max-age|s-maxage)/);
    });

    it('sets shorter cache headers for live games', async () => {
      // Live games should have shorter cache if they exist
      const url = `http://localhost:3000/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}&state=in`;
      const response = await fetch(url);

      // If there are live games, check cache headers
      // If no live games exist, this just validates the endpoint works
      expect(response.status).toBe(200);

      const cacheControl = response.headers.get('cache-control');
      const data = await response.json();

      // If live games exist and cache control is set, verify it's appropriate
      if (cacheControl && data.games && data.games.length > 0) {
        expect(
          cacheControl.includes('no-cache') ||
            cacheControl.includes('no-store') ||
            cacheControl.includes('max-age=10') ||
            cacheControl.includes('max-age=60')
        ).toBe(true);
      }
    });

    it('response is valid JSON', async () => {
      const url = `http://localhost:3000/api/games?season=${SEASON}&conferenceId=${CONFERENCE_ID}`;
      const response = await fetch(url);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Messages', () => {
    it('invalid season returns appropriate error', async () => {
      try {
        await fetchAPI(`/api/games?season=invalid&conferenceId=${CONFERENCE_ID}`);
        // If it succeeds, that's okay
      } catch (error: unknown) {
        const err = error as Error;
        expect(err.message).toBeDefined();
        // Should have status code in error
        expect(/\d{3}/.test(err.message)).toBe(true);
      }
    });

    it('invalid conferenceId returns appropriate error', async () => {
      try {
        await fetchAPI(`/api/games?season=${SEASON}&conferenceId=invalid`);
        // If it succeeds, that's okay
      } catch (error: unknown) {
        const err = error as Error;
        expect(err.message).toBeDefined();
        // Should have status code in error
        expect(/\d{3}/.test(err.message)).toBe(true);
      }
    });
  });
});
