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

  describe('Basic Transformation', () => {
    it('transforms ESPN team response to internal format', () => {
      const result = reshapeTeamData(teamResponse, recordResponse);

      expect(result).toBeDefined();
      expect(result?._id).toBeDefined();
      expect(result?.displayName).toBeDefined();
      expect(result?.abbreviation).toBeDefined();
    });

    it('preserves all required team fields', () => {
      const result = reshapeTeamData(teamResponse, recordResponse);

      expect(result).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
          displayName: expect.any(String),
          abbreviation: expect.any(String),
          color: expect.any(String),
          alternateColor: expect.any(String),
          conferenceId: expect.any(String),
        })
      );
    });

    it('selects best logo by size', () => {
      const responseWithMultipleLogos: ESPNTeamResponse = {
        ...teamResponse,
        team: {
          ...teamResponse.team,
          logos: [
            { href: 'https://small.png', width: 150, height: 150 },
            { href: 'https://medium.png', width: 300, height: 300 },
            { href: 'https://large.png', width: 500, height: 500 },
          ],
        },
      };

      const result = reshapeTeamData(responseWithMultipleLogos);
      expect(result?.logo).toBe('https://large.png');
    });

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
    it('extracts all record types from core API', () => {
      const result = reshapeTeamData(teamResponse, recordResponse);

      expect(result?.record).toBeDefined();
      if (result?.record) {
        // Check that record has expected structure
        expect(result.record).toEqual(
          expect.objectContaining({
            overall: expect.anything(),
          })
        );
      }
    });

    it('extracts record statistics correctly', () => {
      const result = reshapeTeamData(teamResponse, recordResponse);

      if (result?.record?.stats) {
        expect(result.record.stats).toEqual(
          expect.objectContaining({
            wins: expect.any(Number),
            losses: expect.any(Number),
          })
        );
      }
    });

    it('handles missing record data gracefully', () => {
      const result = reshapeTeamData(teamResponse);

      expect(result?.record).toBeDefined();
      expect(Object.keys(result?.record || {})).toBeDefined();
    });

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
    it('includes valid national ranking when present', () => {
      const result = reshapeTeamData(teamResponse, recordResponse);
      // Ranking may or may not be present in test data
      if (teamResponse.team.rank !== undefined && teamResponse.team.rank !== null) {
        if (teamResponse.team.rank === 99) {
          expect(result?.nationalRanking).toBeNull();
        } else {
          expect(result?.nationalRanking).toBe(teamResponse.team.rank);
        }
      }
    });

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

    it('returns null for undefined team data', () => {
      const invalidResponse = {
        team: undefined,
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

  describe('Timestamp', () => {
    it('adds lastUpdated timestamp', () => {
      const beforeTime = new Date();
      const result = reshapeTeamData(teamResponse, recordResponse);
      const afterTime = new Date();

      expect(result?.lastUpdated).toBeDefined();
      expect(result?.lastUpdated?.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result?.lastUpdated?.getTime()).toBeLessThanOrEqual(afterTime.getTime());
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
      { abbreviation: teamResponse.team.abbreviation, data: teamResponse, recordData: recordResponse },
      { abbreviation: teamResponse.team.abbreviation, data: teamResponse, recordData: recordResponse },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]._id).toBe(teamResponse.team.id);
    expect(result[1]._id).toBe(teamResponse.team.id);
  });

  it('filters out null results', () => {
    const invalidResponse = { team: null };
    const result = reshapeTeamsData([
      { abbreviation: teamResponse.team.abbreviation, data: teamResponse, recordData: recordResponse },
      {
        abbreviation: 'INV',
        data: invalidResponse as unknown as ESPNTeamResponse,
        recordData: recordResponse,
      },
    ]);

    expect(result).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = reshapeTeamsData([]);
    expect(result).toEqual([]);
  });

  it('skips teams with missing data property', () => {
    const result = reshapeTeamsData([
      { abbreviation: teamResponse.team.abbreviation, data: teamResponse, recordData: recordResponse },
      {
        abbreviation: 'INV',
        data: null as unknown as ESPNTeamResponse,
        recordData: recordResponse,
      },
    ]);

    expect(result).toHaveLength(1);
  });
});
