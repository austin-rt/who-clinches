import { reshapeTeamData } from '@/lib/reshape-teams';
import type { EspnTeamGenerated } from '@/lib/espn/espn-team-generated';
import { loadTeamTestData, checkTestDataAvailable } from '../helpers/test-data-loader';
import { dbDisconnectTest } from '@/lib/mongodb-test';

describe('reshapeTeamData', () => {
  let teamResponse: EspnTeamGenerated;

  beforeAll(async () => {
    try {
      const available = await checkTestDataAvailable();
      if (!available.available) {
        throw new Error(
          `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:missing_data | MISSING_TYPES:${available.missing.join(',')} | EXPECTED:all_test_data_available | ACTUAL:missing_types | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
        );
      }

      teamResponse = await loadTeamTestData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:load_failed | EXPECTED:test_data_loaded | ACTUAL:${errorMessage} | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Ensure test database is populated by running /api/cron/update-test-data, then update reshape functions if API format changed`
      );
    }
  });

  afterAll(async () => {
    await dbDisconnectTest();
  });

  describe('Basic Transformation', () => {
    it('handles null/missing logos gracefully', () => {
      const responseNoLogos: EspnTeamGenerated = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          logos: [],
        },
      };

      const result = reshapeTeamData(responseNoLogos);
      expect(result?.logo).toBe('');
    });
  });

  describe('Record Handling', () => {
    it('falls back to site API records', () => {
      const responseWithSiteAPI: EspnTeamGenerated = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          record: {
            items: [
              {
                description: 'Overall Record',
                type: 'total',
                summary: '8-1',
                stats: [
                  { name: 'wins', value: 8 },
                  { name: 'losses', value: 1 },
                ],
              },
            ],
          },
        },
      };

      const result = reshapeTeamData(responseWithSiteAPI);
      expect(result?.record?.overall).toBeDefined();
    });
  });

  describe('Ranking Handling', () => {
    it('treats rank 99 as unranked', () => {
      const unrankedResponse: EspnTeamGenerated = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          rank: 99,
        },
      };

      const result = reshapeTeamData(unrankedResponse);
      expect(result?.nationalRanking).toBeNull();
    });

    it('treats null rank as unranked', () => {
      const unrankedResponse: EspnTeamGenerated = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          rank: 0,
        },
      };

      const result = reshapeTeamData(unrankedResponse);
      expect(result?.nationalRanking).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('returns null for null team data', () => {
      const invalidResponse = {
        team: null,
      } as unknown as EspnTeamGenerated;

      const result = reshapeTeamData(invalidResponse);
      expect(result).toBeNull();
    });

    it('handles missing conference data', () => {
      const responseNoConf: EspnTeamGenerated = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          groups: {
            id: '',
            parent: { id: '' },
            isConference: false,
          },
        },
      };

      const result = reshapeTeamData(responseNoConf);
      expect(result?.conferenceId).toBeDefined();
    });
  });
});
