import { fetchAPI } from '../../setup';
import { sports, type ConferenceSlug } from '@/lib/constants';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../helpers/db-mock-setup';
import { GamesResponse } from '@/lib/api-types';

const SEASON = 2025;

const CFB_CONFS = Object.keys(sports.cfb.conferences) as ConferenceSlug[];

describe.each(CFB_CONFS)('POST /api/games/cfb/%s', (conf) => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Fetch and Return Games', () => {
    it('fetches from ESPN, upserts to database, and returns games', async () => {
      const response = await fetchAPI<GamesResponse>(`/api/games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          force: true,
        }),
      });

      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.events.length).toBeGreaterThan(0);
      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
    }, 60000);

    it('live endpoint updates live game data', async () => {
      const response = await fetchAPI<GamesResponse>(`/api/games/cfb/${conf}/live`, {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          force: true,
        }),
      });

      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
    }, 60000);

    it('spreads endpoint updates spread and odds data', async () => {
      const response = await fetchAPI<GamesResponse>(`/api/games/cfb/${conf}/spreads`, {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          force: true,
        }),
      });

      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
    }, 60000);
  });

  // Game data validation tests removed - these verified reshape function output
  // which is already covered by unit tests in __tests__/lib/reshape-games.test.ts

  describe('Season Validation', () => {
    it('GET with week but no season returns 400 with clear error message', async () => {
      try {
        await fetchAPI(`/api/games/cfb/${conf}?week=1`, {
          method: 'GET',
        });
        fail('Expected request to fail with 400');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('400');
        expect(errorMessage).toContain('Season is required when week is provided');
      }
    });

    it('POST without season returns 400 with clear error message', async () => {
      try {
        await fetchAPI(`/api/games/cfb/${conf}`, {
          method: 'POST',
          body: JSON.stringify({
            force: true,
          }),
        });
        fail('Expected request to fail with 400');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('400');
        expect(errorMessage).toContain('Season is required');
      }
    });

    it('POST /spreads without season returns 400 with clear error message', async () => {
      try {
        await fetchAPI(`/api/games/cfb/${conf}/spreads`, {
          method: 'POST',
          body: JSON.stringify({
            force: true,
          }),
        });
        fail('Expected request to fail with 400');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('400');
        expect(errorMessage).toContain('Season is required');
      }
    });

    it('POST /live without season parameter works (no error)', async () => {
      const response = await fetchAPI<GamesResponse>(`/api/games/cfb/${conf}/live`, {
        method: 'POST',
        body: JSON.stringify({
          force: true,
        }),
      });

      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
      expect(response.lastUpdated).toBeDefined();
    }, 60000);
  });
});
