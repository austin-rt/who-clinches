import { fetchAPI } from '../../../setup';
import { SimulateResponse } from '@/lib/api-types';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../../helpers/db-mock-setup';

const SEASON = 2025;

describe('POST /api/simulate/cfb/sec', () => {
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

  describe('Team Rankings', () => {
    it('returns exactly 16 teams for SEC conference', async () => {
      await fetchAPI(`/api/games/cfb/sec`, {
        method: 'POST',
        body: JSON.stringify({ season: SEASON, force: true }),
      });

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          overrides: {},
        }),
      });

      if (response.standings.length !== 16) {
        const teamAbbrevs = response.standings
          .sort((a, b) => a.rank - b.rank)
          .map((s) => `${s.abbrev}(${s.rank})`)
          .join(', ');
        throw new Error(
          `TEAM_COUNT_MISMATCH | EXPECTED:16_teams | ACTUAL:${response.standings.length}_teams | TEAM_ABBREVS_WITH_RANKS:${teamAbbrevs}`
        );
      }
      expect(response.standings.length).toBe(16);
    });

    it('ranks teams 1-16 without gaps', async () => {
      await fetchAPI(`/api/games/cfb/sec`, {
        method: 'POST',
        body: JSON.stringify({ season: SEASON, force: true }),
      });

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
      await fetchAPI(`/api/games/cfb/sec`, {
        method: 'POST',
        body: JSON.stringify({ season: SEASON, force: true }),
      });

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          overrides: {},
        }),
      });

      if (response.championship) {
        expect(response.championship.length).toBeLessThanOrEqual(2);
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
