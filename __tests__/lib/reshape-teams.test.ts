/**
 * Unit Tests: Reshape Team Data Functions
 *
 * Tests for team data transformation functions that convert
 * ESPN Team API responses into our internal team data format.
 * Uses real ESPN API response snapshots from test database.
 */

import { reshapeTeamData, reshapeTeamsData } from '@/lib/reshape-teams';
import { ESPNTeamResponse, ESPNCoreRecordResponse } from '@/lib/espn-client';
import {
  loadTeamTestData,
  loadTeamRecordsTestData,
  checkTestDataAvailable,
} from '../helpers/test-data-loader';

describe('reshapeTeamData', () => {
  let teamResponse: ESPNTeamResponse;

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

  describe('Basic Transformation', () => {
    it('handles null/missing logos gracefully', () => {
      const responseNoLogos: ESPNTeamResponse = {
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
      const responseWithSiteAPI: ESPNTeamResponse = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          record: {
            items: [
              {
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
      const unrankedResponse: ESPNTeamResponse = {
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
      const unrankedResponse: ESPNTeamResponse = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          rank: undefined,
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
      } as unknown as ESPNTeamResponse;

      const result = reshapeTeamData(invalidResponse);
      expect(result).toBeNull();
    });

    it('handles missing conference data', () => {
      const responseNoConf: ESPNTeamResponse = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          groups: undefined,
        },
      };

      const result = reshapeTeamData(responseNoConf);
      // Should still have a conferenceId (may default to SEC)
      expect(result?.conferenceId).toBeDefined();
    });
  });
});

describe('reshapeTeamsData', () => {
  let teamResponse: ESPNTeamResponse;
  let recordResponse: ESPNCoreRecordResponse;

  beforeAll(async () => {
    try {
      const available = await checkTestDataAvailable();
      if (!available.available) {
        throw new Error(
          `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:missing_data | MISSING_TYPES:${available.missing.join(',')} | EXPECTED:all_test_data_available | ACTUAL:missing_types | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
        );
      }

      teamResponse = await loadTeamTestData();
      recordResponse = await loadTeamRecordsTestData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:load_failed | EXPECTED:test_data_loaded | ACTUAL:${errorMessage} | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Ensure test database is populated by running /api/cron/update-test-data, then update reshape functions if API format changed`
      );
    }
  });

  it('transforms multiple team responses', () => {
    const result = reshapeTeamsData([
      {
        abbreviation: teamResponse.team.abbreviation,
        data: teamResponse,
        recordData: recordResponse,
      },
      {
        abbreviation: teamResponse.team.abbreviation,
        data: teamResponse,
        recordData: recordResponse,
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]._id).toBe(teamResponse.team.id);
    expect(result[1]._id).toBe(teamResponse.team.id);
  });

  it('filters out null results', () => {
    const invalidResponse = { team: null };
    const result = reshapeTeamsData([
      {
        abbreviation: teamResponse.team.abbreviation,
        data: teamResponse,
        recordData: recordResponse,
      },
      {
        abbreviation: 'INV',
        data: invalidResponse as unknown as ESPNTeamResponse,
        recordData: recordResponse,
      },
    ]);

    expect(result).toHaveLength(1);
  });
});
