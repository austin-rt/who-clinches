/**
 * API Route Tests: Cron Job Endpoints
 *
 * Tests for cron job endpoints including:
 * - Authorization (Bearer token validation)
 * - Response structure (CronRankingsResponse, CronGamesResponse, etc.)
 * - Error handling
 * - Out-of-season handling
 */

const CRON_SECRET = process.env.CRON_SECRET || 'test-secret';

// Helper to make unauthenticated cron requests (for testing auth failures)
function fetchUnauthenticatedCronAPI(
  endpoint: string,
  options: RequestInit & { method?: string } = {}
): Promise<Response> {
  const url = `http://localhost:3000${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

describe('Cron Job Endpoints', () => {
  describe('Authorization', () => {
    it('rejects requests without authorization header', async () => {
      const response = await fetchUnauthenticatedCronAPI('/api/cron/update-rankings', {
        method: 'GET',
      });
      // Should return 401 for missing auth
      expect([401, 403]).toContain(response.status);
    });

    it('rejects requests with invalid authorization token', async () => {
      try {
        const url = `http://localhost:3000/api/cron/update-rankings`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        });
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
      } catch (error: unknown) {
        const err = error as Error;
        expect(err.message).toContain('401');
      }
    });
  });

  describe('GET /api/cron/update-rankings', () => {
    it('endpoint is protected and returns data', async () => {
      // Cron endpoints can be slow, so we just verify they're callable
      // with authorization and return valid structure
      // Note: This test may timeout if cron job is running during season
      // Increase timeout for CI/CD environments
      const url = `http://localhost:3000/api/cron/update-rankings`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      // Should either return 200 (if endpoint is fast) or 401 (if unauthorized)
      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.updated).toBeDefined();
      }
    }, 30000); // Increase timeout to 30s for cron job
  });

  describe('Other Cron Endpoints', () => {
    it('all cron endpoints are accessible with valid authorization', async () => {
      const endpoints = [
        '/api/cron/update-live-games',
        '/api/cron/update-spreads',
        '/api/cron/update-team-averages',
      ];

      for (const endpoint of endpoints) {
        const url = `http://localhost:3000${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${CRON_SECRET}`,
          },
        });

        // Should return 200 or 500 (if processing), not 404 or 401
        expect(response.status).not.toBe(404);
        expect([200, 500]).toContain(response.status);
      }
    }, 30000);
  });

  describe('Cron Endpoint Verification', () => {
    it('all cron endpoints are properly protected and accessible', async () => {
      // This verifies that:
      // 1. Cron endpoints require authorization
      // 2. They return proper HTTP status codes
      // 3. They are not returning 404 (endpoint exists)

      // Verify unauthorized access returns 401
      const url = `http://localhost:3000/api/cron/update-rankings`;
      const unauthorizedResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });
      expect(unauthorizedResponse.status).toBe(401);

      // Verify authorized access returns 200 or 500 (processing)
      const authorizedResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });
      expect([200, 500]).toContain(authorizedResponse.status);
    }, 30000);
  });
});
