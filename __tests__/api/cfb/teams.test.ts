import { fetchAPI } from '../../setup';
import { sports, type ConferenceSlug } from '@/lib/constants';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../helpers/db-mock-setup';
import Team from '@/lib/models/Team';
import { TeamsResponse } from '@/lib/api-types';

const CFB_CONFS = Object.keys(sports.cfb.conferences) as ConferenceSlug[];

describe.each(CFB_CONFS)('POST /api/teams/cfb/%s', (conf) => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Fetch and Return Teams', () => {
    it('fetches from ESPN, upserts to database, and returns teams', async () => {
      // First seed teams via games endpoint
      const conferenceMeta = sports.cfb.conferences[conf];
      await Team.deleteMany({ conferenceId: conferenceMeta.espnId });

      // Games endpoint will extract teams from scoreboard
      await fetchAPI(`/api/games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ season: 2025, force: true }),
      });

      // Now test teams endpoint
      const response = await fetchAPI<TeamsResponse>(`/api/teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ force: true }),
      });

      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
      expect(response.teams.length).toBe(conferenceMeta.teams);
      expect(response.lastUpdated).toBeDefined();
    }, 60000);

    it('supports update=rankings in body', async () => {
      // Ensure teams exist first
      await fetchAPI(`/api/games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ season: 2025, force: true }),
      });

      const response = await fetchAPI<TeamsResponse>(`/api/teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ update: 'rankings', force: true }),
      });

      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
    }, 60000);

    it('supports update=stats in body', async () => {
      // Ensure teams exist first
      await fetchAPI(`/api/games/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ season: 2025, force: true }),
      });

      const response = await fetchAPI<TeamsResponse>(`/api/teams/cfb/${conf}`, {
        method: 'POST',
        body: JSON.stringify({ update: 'stats', force: true }),
      });

      expect(response.teams).toBeDefined();
      expect(Array.isArray(response.teams)).toBe(true);
    }, 60000);
  });
});
