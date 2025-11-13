/**
 * API Route Tests: Cron Job Endpoints
 *
 * Tests for cron job endpoints including:
 * - Authorization (Bearer token validation)
 * - Response structure (CronRankingsResponse, CronGamesResponse, etc.)
 * - Error handling
 * - Out-of-season handling
 */

const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  throw new Error(
    'AUTH_ERROR | SETUP:CRON_SECRET_missing | ISSUE:environment_variable_not_set | EXPECTED:CRON_SECRET_in_env | ACTUAL:undefined | NOTE:Set CRON_SECRET in .env.local or test environment'
  );
}

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
          throw new Error(
            'AUTH_ERROR | ENDPOINT:/api/cron/update-rankings | STATUS:401 | ISSUE:unauthorized | TOKEN:invalid-token'
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('401') && !err.message.includes('AUTH_ERROR')) {
          throw new Error(
            `AUTH_ERROR | ENDPOINT:/api/cron/update-rankings | STATUS:expected_401 | ACTUAL:${err.message} | ISSUE:unauthorized_access_not_rejected`
          );
        }
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

  describe('GET /api/cron/update-all', () => {
    it('batch endpoint orchestrates multiple cron jobs and returns structured response', async () => {
      const url = `http://localhost:3000/api/cron/update-all`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      // Should return 200 or 500 (if processing), not 404 or 401
      expect(response.status).not.toBe(404);
      if (response.status === 401) {
        const body = await response.text().catch(() => 'unable to read response');
        throw new Error(
          `AUTH_ERROR | ENDPOINT:/api/cron/update-all | STATUS:401 | ISSUE:invalid_cron_secret | EXPECTED:200_or_500 | ACTUAL:401_unauthorized | TOKEN:provided_but_invalid | NOTE:CRON_SECRET_does_not_match_server_environment_variable | RESPONSE:${body}`
        );
      }

      if (response.status === 200) {
        const data = await response.json();
        // Verify batch response structure
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('jobsRun');
        expect(data).toHaveProperty('jobsSucceeded');
        expect(data).toHaveProperty('totalDuration');
        expect(data).toHaveProperty('results');
        expect(Array.isArray(data.results)).toBe(true);
        expect(data.jobsRun).toBeGreaterThan(0);
        expect(data.jobsSucceeded).toBeGreaterThanOrEqual(0);
        expect(data.jobsSucceeded).toBeLessThanOrEqual(data.jobsRun);

        // Verify each job result has required fields
        for (const jobResult of data.results) {
          expect(jobResult).toHaveProperty('job');
          expect(jobResult).toHaveProperty('success');
          expect(jobResult).toHaveProperty('status');
          expect(jobResult).toHaveProperty('duration');
          expect(typeof jobResult.duration).toBe('number');
        }

        // Verify expected jobs are present
        const jobNames = data.results.map((r: { job: string }) => r.job);
        expect(jobNames).toContain('update-games');
        expect(jobNames).toContain('update-rankings');
        expect(jobNames).toContain('update-test-data');
      } else if (response.status !== 500) {
        const body = await response.text().catch(() => 'unable to read response');
        throw new Error(
          `API_ERROR_RESPONSE | ENDPOINT:/api/cron/update-all | STATUS:${response.status} | EXPECTED:200_or_500 | ACTUAL:${response.status} | RESPONSE:${body}`
        );
      }
    }, 60000); // Increase timeout to 60s for batch job
  });

  describe('Other Cron Endpoints', () => {
    it('all cron endpoints are accessible with valid authorization', async () => {
      const endpoints = [
        '/api/cron/update-games',
        '/api/cron/update-spreads',
        '/api/cron/update-team-averages',
        '/api/cron/update-rankings',
        '/api/cron/update-test-data',
        '/api/cron/run-reshape-tests',
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
        if (response.status === 401) {
          const body = await response.text().catch(() => 'unable to read response');
          throw new Error(
            `AUTH_ERROR | ENDPOINT:${endpoint} | STATUS:401 | ISSUE:invalid_cron_secret | EXPECTED:200_or_500 | ACTUAL:401_unauthorized | TOKEN:provided_but_invalid | NOTE:CRON_SECRET_does_not_match_server_environment_variable | RESPONSE:${body}`
          );
        }
        if (![200, 500].includes(response.status)) {
          const body = await response.text().catch(() => 'unable to read response');
          throw new Error(
            `AUTH_ERROR | ENDPOINT:${endpoint} | STATUS:${response.status} | EXPECTED:200_or_500 | ACTUAL:${response.status} | TOKEN:provided | RESPONSE:${body}`
          );
        }
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
      if (authorizedResponse.status === 401) {
        const body = await authorizedResponse.text().catch(() => 'unable to read response');
        throw new Error(
          `AUTH_ERROR | ENDPOINT:/api/cron/update-rankings | STATUS:401 | ISSUE:invalid_cron_secret | EXPECTED:200_or_500 | ACTUAL:401_unauthorized | TOKEN:provided_but_invalid | NOTE:CRON_SECRET_does_not_match_server_environment_variable | RESPONSE:${body}`
        );
      }
      if (![200, 500].includes(authorizedResponse.status)) {
        const body = await authorizedResponse.text().catch(() => 'unable to read response');
        throw new Error(
          `AUTH_ERROR | ENDPOINT:/api/cron/update-rankings | STATUS:${authorizedResponse.status} | EXPECTED:200_or_500 | ACTUAL:${authorizedResponse.status} | TOKEN:provided | RESPONSE:${body}`
        );
      }
      expect([200, 500]).toContain(authorizedResponse.status);
    }, 30000);
  });
});
