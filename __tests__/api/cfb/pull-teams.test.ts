import { fetchAPI } from '../../setup';
import { sports, type ConferenceSlug } from '@/lib/constants';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../helpers/db-mock-setup';
import Team from '@/lib/models/Team';

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: number | string;
}

const CFB_CONFS = Object.keys(sports.cfb.conferences) as ConferenceSlug[];

describe.each(CFB_CONFS)('POST /api/pull-teams/cfb/%s', (conf) => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Conference Pull', () => {
    it(`pulls all ${conf.toUpperCase()} teams`, async () => {
      // Clear teams to ensure extraction happens
      const conferenceMeta = sports.cfb.conferences[conf];
      await Team.deleteMany({ conferenceId: conferenceMeta.espnId });

      const response = await fetchAPI<PullTeamsResponse>(`/api/pull-teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.upserted).toBe(conferenceMeta.teams);
    }, 60000);
  });

  describe('Existing Teams', () => {
    it('returns existing team count when teams already exist', async () => {
      // Call pull-games first to seed teams
      interface PullGamesResponse {
        upserted: number;
        weeksPulled: number[];
        lastUpdated: number | string;
      }
      const pullGamesResponse = await fetchAPI<PullGamesResponse>(`/api/pull-games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ season: 2025 }),
      });
      expect(pullGamesResponse.upserted).toBeGreaterThan(0);

      // Now call pull-teams (should return existing count, not extract again)
      const pullTeamsResponse = await fetchAPI<PullTeamsResponse>(`/api/pull-teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const conferenceMeta = sports.cfb.conferences[conf];
      expect(pullTeamsResponse.upserted).toBe(conferenceMeta.teams);
    }, 60000);
  });

  // Input validation tests removed - sport/league/conf are now in URL path
  // No body parameters are required for pull-teams endpoint
});
