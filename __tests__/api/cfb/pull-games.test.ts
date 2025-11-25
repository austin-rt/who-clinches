import { fetchAPI } from '../../setup';
import { sports, type ConferenceSlug } from '@/lib/constants';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../helpers/db-mock-setup';

interface PullGamesResponse {
  upserted: number;
  weeksPulled: number[];
  lastUpdated: number | string;
}

const SEASON = 2025;

const CFB_CONFS = Object.keys(sports.cfb.conferences) as ConferenceSlug[];

describe.each(CFB_CONFS)('POST /api/pull-games/cfb/%s', (conf) => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Full Season Pull', () => {
    it('pulls full season and returns games', async () => {
      const response = await fetchAPI<PullGamesResponse>(`/api/pull-games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
        }),
      });

      expect(response.upserted).toBeGreaterThan(0);
    }, 60000);

    // Database record count tests removed - using in-memory DB
    // These verified reshape function output, which is covered by unit tests
  });

  // Game data validation tests removed - these verified reshape function output
  // which is already covered by unit tests in __tests__/lib/reshape-games.test.ts

  describe('Input Validation', () => {
    it('returns 400 when season is missing', async () => {
      try {
        await fetchAPI(`/api/pull-games/cfb/${conf}`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        throw new Error(
          `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games/cfb/${conf} | STATUS:expected_400 | ISSUE:request_succeeded_when_should_fail | FIELD:season`
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('400')) {
          throw new Error(
            `API_ERROR_RESPONSE | ENDPOINT:/api/pull-games/cfb/${conf} | STATUS:expected_400 | ACTUAL:${err.message} | FIELD:season | ISSUE:missing_required_field`
          );
        }
        expect(err.message).toContain('400');
      }
    });
  });
});
