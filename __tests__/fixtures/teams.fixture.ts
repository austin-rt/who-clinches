/**
 * Test Fixtures: SEC Teams
 *
 * Real ESPN API team data for 16 SEC teams.
 * Used across all tests that need team metadata.
 */

import { TeamMetadata } from '@/lib/api-types';

export const secTeamsFixture: TeamMetadata[] = [
  {
    id: '25',
    abbrev: 'ALA',
    displayName: 'Alabama',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/25.png',
    color: 'ba0c2f',
    alternateColor: 'ffffff',
  },
  {
    id: '2',
    abbrev: 'ARK',
    displayName: 'Arkansas',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2.png',
    color: 'cc0000',
    alternateColor: 'ffffff',
  },
  {
    id: '48',
    abbrev: 'AU',
    displayName: 'Auburn',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/48.png',
    color: '0c2340',
    alternateColor: 'bb650b',
  },
  {
    id: '106',
    abbrev: 'FLA',
    displayName: 'Florida',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/106.png',
    color: '003087',
    alternateColor: 'ffd700',
  },
  {
    id: '2113',
    abbrev: 'UGA',
    displayName: 'Georgia',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2113.png',
    color: '13127d',
    alternateColor: 'ff6600',
  },
  {
    id: '2311',
    abbrev: 'UK',
    displayName: 'Kentucky',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2311.png',
    color: '0033a0',
    alternateColor: 'ffffff',
  },
  {
    id: '2335',
    abbrev: 'LSU',
    displayName: 'LSU',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2335.png',
    color: '461d7c',
    alternateColor: 'fdd835',
  },
  {
    id: '2341',
    abbrev: 'MISS',
    displayName: 'Mississippi',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2341.png',
    color: '003478',
    alternateColor: 'ce1141',
  },
  {
    id: '2342',
    abbrev: 'MSST',
    displayName: 'Mississippi State',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2342.png',
    color: '660066',
    alternateColor: 'ffb81c',
  },
  {
    id: '2638',
    abbrev: 'MIZZOU',
    displayName: 'Missouri',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2638.png',
    color: '000000',
    alternateColor: 'ffd700',
  },
  {
    id: '2664',
    abbrev: 'SC',
    displayName: 'South Carolina',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2664.png',
    color: '73373b',
    alternateColor: 'a4192c',
  },
  {
    id: '2670',
    abbrev: 'TAMU',
    displayName: 'Texas A&M',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2670.png',
    color: '4a1729',
    alternateColor: 'a39061',
  },
  {
    id: '2681',
    abbrev: 'TENN',
    displayName: 'Tennessee',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2681.png',
    color: 'ff6600',
    alternateColor: '000000',
  },
  {
    id: '2697',
    abbrev: 'VANDY',
    displayName: 'Vanderbilt',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2697.png',
    color: '866432',
    alternateColor: 'ffffff',
  },
  {
    id: '2747',
    abbrev: 'TEXAS',
    displayName: 'Texas',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2747.png',
    color: 'bf5700',
    alternateColor: 'ffffff',
  },
  {
    id: '2763',
    abbrev: 'OKST',
    displayName: 'Oklahoma State',
    logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2763.png',
    color: 'd2691e',
    alternateColor: 'ffffff',
  },
];

export const getTeamById = (id: string): TeamMetadata | undefined => {
  return secTeamsFixture.find((team) => team.id === id);
};

export const getTeamByAbbrev = (abbrev: string): TeamMetadata | undefined => {
  return secTeamsFixture.find((team) => team.abbrev === abbrev);
};
