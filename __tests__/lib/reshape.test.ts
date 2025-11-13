/**
 * Unit Tests: Reshape Functions
 *
 * Tests for data transformation functions that convert
 * ESPN API responses into our internal data format.
 */

import { reshapeTeamData, reshapeTeamsData } from '@/lib/reshape-teams';
import { ESPNTeamResponse, ESPNCoreRecordResponse } from '@/lib/espn-client';

describe('reshapeTeamData', () => {
  const mockTeamResponse: ESPNTeamResponse = {
    team: {
      id: '25',
      name: 'Alabama Crimson Tide',
      displayName: 'Alabama',
      abbreviation: 'ALA',
      color: 'ba0c2f',
      alternateColor: 'ffffff',
      logos: [
        {
          href: 'https://a.espncdn.com/i/teamlogos/ncaa/500/25.png',
          width: 500,
          height: 500,
        },
      ],
      rank: 5,
      standingSummary: '6-1',
      groups: {
        parent: {
          id: '8',
          name: 'SEC',
        },
      },
    },
  };

  const mockRecordResponse: ESPNCoreRecordResponse = {
    items: [
      {
        type: 'total',
        summary: '8-1',
        stats: [
          { name: 'wins', value: 8 },
          { name: 'losses', value: 1 },
          { name: 'winPercent', value: 0.889 },
          { name: 'pointsFor', value: 285 },
          { name: 'pointsAgainst', value: 120 },
          { name: 'pointDifferential', value: 165 },
          { name: 'avgPointsFor', value: 31.67 },
          { name: 'avgPointsAgainst', value: 13.33 },
        ],
      },
      {
        type: 'homerecord',
        summary: '4-0',
        stats: [],
      },
      {
        type: 'awayrecord',
        summary: '4-1',
        stats: [],
      },
      {
        type: 'vsconf',
        summary: '5-0',
        stats: [],
      },
    ],
  };

  describe('Basic Transformation', () => {
    it('transforms ESPN team response to internal format', () => {
      const result = reshapeTeamData(mockTeamResponse, mockRecordResponse);

      expect(result).toBeDefined();
      expect(result?._id).toBe('25');
      expect(result?.displayName).toBe('Alabama');
      expect(result?.abbreviation).toBe('ALA');
    });

    it('preserves all required team fields', () => {
      const result = reshapeTeamData(mockTeamResponse, mockRecordResponse);

      expect(result).toEqual(
        expect.objectContaining({
          _id: '25',
          name: 'Alabama Crimson Tide',
          displayName: 'Alabama',
          abbreviation: 'ALA',
          color: 'ba0c2f',
          alternateColor: 'ffffff',
          conferenceId: '8',
          nationalRanking: 5,
          conferenceStanding: '6-1',
        })
      );
    });

    it('selects best logo by size', () => {
      const responseWithMultipleLogos: ESPNTeamResponse = {
        ...mockTeamResponse,
        team: {
          ...mockTeamResponse.team,
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
        ...mockTeamResponse,
        team: {
          ...mockTeamResponse.team,
          logos: [],
        },
      };

      const result = reshapeTeamData(responseNoLogos);
      expect(result?.logo).toBe('');
    });
  });

  describe('Record Handling', () => {
    it('extracts all record types from core API', () => {
      const result = reshapeTeamData(mockTeamResponse, mockRecordResponse);

      expect(result?.record).toEqual(
        expect.objectContaining({
          overall: '8-1',
          home: '4-0',
          away: '4-1',
          conference: '5-0',
        })
      );
    });

    it('extracts record statistics correctly', () => {
      const result = reshapeTeamData(mockTeamResponse, mockRecordResponse);

      expect(result?.record.stats).toEqual(
        expect.objectContaining({
          wins: 8,
          losses: 1,
          winPercent: 0.889,
          pointsFor: 285,
          pointsAgainst: 120,
          pointDifferential: 165,
          avgPointsFor: 31.67,
          avgPointsAgainst: 13.33,
        })
      );
    });

    it('handles missing record data gracefully', () => {
      const result = reshapeTeamData(mockTeamResponse);

      expect(result?.record).toBeDefined();
      expect(Object.keys(result?.record || {})).toBeDefined();
    });

    it('falls back to site API records', () => {
      const responseWithSiteAPI: ESPNTeamResponse = {
        ...mockTeamResponse,
        team: {
          ...mockTeamResponse.team,
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
      expect(result?.record.overall).toBe('8-1');
    });
  });

  describe('Ranking Handling', () => {
    it('includes valid national ranking', () => {
      const result = reshapeTeamData(mockTeamResponse, mockRecordResponse);
      expect(result?.nationalRanking).toBe(5);
    });

    it('treats rank 99 as unranked', () => {
      const unrankedResponse: ESPNTeamResponse = {
        ...mockTeamResponse,
        team: {
          ...mockTeamResponse.team,
          rank: 99,
        },
      };

      const result = reshapeTeamData(unrankedResponse);
      expect(result?.nationalRanking).toBeNull();
    });

    it('treats null rank as unranked', () => {
      const unrankedResponse: ESPNTeamResponse = {
        ...mockTeamResponse,
        team: {
          ...mockTeamResponse.team,
          rank: null,
        },
      };

      const result = reshapeTeamData(unrankedResponse);
      expect(result?.nationalRanking).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('returns null for null team data', () => {
      const invalidResponse: ESPNTeamResponse = {
        team: null as any,
      };

      const result = reshapeTeamData(invalidResponse);
      expect(result).toBeNull();
    });

    it('returns null for undefined team data', () => {
      const invalidResponse: ESPNTeamResponse = {
        team: undefined as any,
      };

      const result = reshapeTeamData(invalidResponse);
      expect(result).toBeNull();
    });

    it('handles missing conference data', () => {
      const responseNoConf: ESPNTeamResponse = {
        ...mockTeamResponse,
        team: {
          ...mockTeamResponse.team,
          groups: undefined,
        },
      };

      const result = reshapeTeamData(responseNoConf);
      expect(result?.conferenceId).toBe('8'); // Should default to SEC
    });
  });

  describe('Timestamp', () => {
    it('adds lastUpdated timestamp', () => {
      const beforeTime = new Date();
      const result = reshapeTeamData(mockTeamResponse, mockRecordResponse);
      const afterTime = new Date();

      expect(result?.lastUpdated).toBeDefined();
      expect(result?.lastUpdated?.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result?.lastUpdated?.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});

describe('reshapeTeamsData', () => {
  const mockTeamResponse: ESPNTeamResponse = {
    team: {
      id: '25',
      name: 'Alabama',
      displayName: 'Alabama',
      abbreviation: 'ALA',
      color: 'ba0c2f',
      alternateColor: 'ffffff',
      logos: [{ href: 'https://logo.png', width: 500, height: 500 }],
    },
  };

  const mockRecordResponse: ESPNCoreRecordResponse = {
    items: [
      {
        type: 'total',
        summary: '8-1',
        stats: [
          { name: 'wins', value: 8 },
          { name: 'losses', value: 1 },
        ],
      },
    ],
  };

  it('transforms multiple team responses', () => {
    const result = reshapeTeamsData([
      { data: mockTeamResponse, recordData: mockRecordResponse },
      { data: mockTeamResponse, recordData: mockRecordResponse },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]._id).toBe('25');
    expect(result[1]._id).toBe('25');
  });

  it('filters out null results', () => {
    const invalidResponse = { team: null };
    const result = reshapeTeamsData([
      { data: mockTeamResponse, recordData: mockRecordResponse },
      { data: invalidResponse as any, recordData: mockRecordResponse },
    ]);

    expect(result).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = reshapeTeamsData([]);
    expect(result).toEqual([]);
  });

  it('skips teams with missing data property', () => {
    const result = reshapeTeamsData([
      { data: mockTeamResponse, recordData: mockRecordResponse },
      { data: null, recordData: mockRecordResponse } as any,
    ]);

    expect(result).toHaveLength(1);
  });
});
