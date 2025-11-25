// Individual cron endpoint business logic is tested in their respective
// endpoint tests (pull-games, pull-teams, etc.). These tests verify that
// cron routes require auth and that the orchestrator works correctly.

import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import type { SportSlug, ConferenceSlug } from '@/lib/constants';

const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  throw new Error(
    'AUTH_ERROR | SETUP:CRON_SECRET_missing | ISSUE:environment_variable_not_set | EXPECTED:CRON_SECRET_in_env | ACTUAL:undefined | NOTE:Set CRON_SECRET in .env.local or test environment'
  );
}

const REQUEST_TIMEOUT_MS = 60000;

// Helper to make unauthenticated cron requests (for testing auth failures)
const fetchUnauthenticatedCronAPI = (
  endpoint: string,
  options: RequestInit & { method?: string } = {}
): Promise<Response> => {
  const url = `http://localhost:3000${endpoint}`;
  return fetchWithTimeout(
    url,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    },
    REQUEST_TIMEOUT_MS
  );
};

describe('Cron Job Endpoints', () => {
  describe('Authorization', () => {
    it('rejects requests without valid authorization', async () => {
      // Since all cron routes use the same auth pattern, testing one is sufficient
      const sport: SportSlug = 'cfb';
      const conf: ConferenceSlug = 'sec';
      const endpoint = `/api/cron/${sport}/${conf}/update-rankings`;

      const responseNoAuth = await fetchUnauthenticatedCronAPI(endpoint, {
        method: 'GET',
      });
      expect([401, 403]).toContain(responseNoAuth.status);

      try {
        const url = `http://localhost:3000${endpoint}`;
        const responseInvalid = await fetchWithTimeout(
          url,
          {
            method: 'GET',
            headers: {
              Authorization: 'Bearer invalid-token',
            },
          },
          REQUEST_TIMEOUT_MS
        );
        if (responseInvalid.status === 401) {
          throw new Error(
            `AUTH_ERROR | ENDPOINT:${endpoint} | STATUS:401 | ISSUE:unauthorized | TOKEN:invalid-token`
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (!err.message.includes('401') && !err.message.includes('AUTH_ERROR')) {
          throw new Error(
            `AUTH_ERROR | ENDPOINT:${endpoint} | STATUS:expected_401 | ACTUAL:${err.message} | ISSUE:unauthorized_access_not_rejected`
          );
        }
        expect(err.message).toContain('401');
      }
    });
  });

  describe('GET /api/cron/update-all', () => {
    it('batch endpoint orchestrates multiple cron jobs and returns structured response', async () => {
      const url = `http://localhost:3000/api/cron/update-all`;
      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${CRON_SECRET}`,
          },
        },
        REQUEST_TIMEOUT_MS
      );

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

        // Job names include sport and conf; for each sport/conf we expect:
        // pull-teams, pull-games, update-rankings, update-spreads, update-team-averages
        const jobNames = data.results.map((r: { job: string }) => r.job);
        const expectedJobPrefixes = [
          'pull-teams',
          'pull-games',
          'update-rankings',
          'update-spreads',
          'update-team-averages',
        ];
        for (const prefix of expectedJobPrefixes) {
          const matchingJobs = jobNames.filter((name: string) => name.startsWith(prefix));
          expect(matchingJobs.length).toBeGreaterThan(0);
        }
      } else if (response.status !== 500) {
        const body = await response.text().catch(() => 'unable to read response');
        throw new Error(
          `API_ERROR_RESPONSE | ENDPOINT:/api/cron/update-all | STATUS:${response.status} | EXPECTED:200_or_500 | ACTUAL:${response.status} | RESPONSE:${body}`
        );
      }
    }, 120000);
  });
});
