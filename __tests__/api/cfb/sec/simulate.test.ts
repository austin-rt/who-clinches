import { fetchAPI } from '../../../setup';
import { SimulateResponse, GamesResponse } from '@/lib/api-types';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../../helpers/db-mock-setup';

const SEASON = 2025;

describe('POST /api/simulate/[sport]/[conf] - SEC Conference', () => {
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
    it('returns correct number of teams for SEC conference', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(`/api/games/cfb/sec`, {
        method: 'POST',
        body: JSON.stringify({ season: SEASON, force: true }),
      });

      // Verify the API response includes teams (this confirms teams were extracted and saved)
      if (!gamesResponse.teams || gamesResponse.teams.length === 0) {
        throw new Error(
          `API response did not include teams. This suggests teams were not extracted from the scoreboard.`
        );
      }

      // Use the team count from the API response
      // The API queries teams from the database in queryGamesFromDatabase,
      // so if teams are in the response, they exist in the database
      const expectedTeamCount = gamesResponse.teams.length;

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          overrides: {},
        }),
      });

      if (response.standings.length !== expectedTeamCount) {
        const teamAbbrevs = response.standings
          .sort((a, b) => a.rank - b.rank)
          .map((s) => `${s.abbrev}(${s.rank})`)
          .join(', ');
        throw new Error(
          `TEAM_COUNT_MISMATCH | EXPECTED:${expectedTeamCount}_teams | ACTUAL:${response.standings.length}_teams | TEAM_ABBREVS_WITH_RANKS:${teamAbbrevs}`
        );
      }
      expect(response.standings.length).toBe(expectedTeamCount);
    });

    it('ranks teams without gaps', async () => {
      const gamesResponse = await fetchAPI<GamesResponse>(`/api/games/cfb/sec`, {
        method: 'POST',
        body: JSON.stringify({ season: SEASON, force: true }),
      });

      // Use the team count from the API response
      // The API queries teams from the database in queryGamesFromDatabase,
      // so if teams are in the response, they exist in the database
      const expectedTeamCount = gamesResponse.teams?.length || 0;

      if (expectedTeamCount === 0) {
        throw new Error(
          `API response did not include teams. This suggests teams were not extracted from the scoreboard.`
        );
      }

      const response = await fetchAPI<SimulateResponse>('/api/simulate/cfb/sec', {
        method: 'POST',
        body: JSON.stringify({
          season: SEASON,
          overrides: {},
        }),
      });

      const ranks = response.standings.map((entry) => entry.rank);
      expect(ranks.sort((a, b) => a - b)).toEqual(
        Array.from({ length: expectedTeamCount }, (_, i) => i + 1)
      );
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

    it('returns championship matchup with top 2 teams', async () => {
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

      expect(response.championship).toHaveLength(2);
      expect(response.championship[0]).toBe(response.standings[0].teamId);
      expect(response.championship[1]).toBe(response.standings[1].teamId);
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
