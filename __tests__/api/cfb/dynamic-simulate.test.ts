import { fetchAPI } from '../../setup';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../helpers/db-mock-setup';

const SEASON = 2025;

describe('POST /api/simulate/[sport]/[conf] - Dynamic Endpoint', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Error Handling', () => {
    it('returns 400 for unsupported conference', async () => {
      try {
        await fetchAPI('/api/simulate/cfb/invalid', {
          method: 'POST',
          body: JSON.stringify({
            season: SEASON,
            overrides: {},
          }),
        });
        fail('Expected request to fail with 400');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('400');
        expect(errorMessage).toContain('Unsupported conference');
      }
    });

    it('returns 400 for missing season', async () => {
      try {
        await fetchAPI('/api/simulate/cfb/sec', {
          method: 'POST',
          body: JSON.stringify({
            overrides: {},
          }),
        });
        fail('Expected request to fail with 400');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('400');
        expect(errorMessage).toContain('Season is required');
      }
    });
  });
});
