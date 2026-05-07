import { attachSpPlusToTeams } from '@/lib/cfb/helpers/attach-sp-plus';
import { TeamLean } from '@/lib/types';
import type { TeamSP } from 'cfbd';

const makeTeam = (overrides: Partial<TeamLean> = {}): TeamLean => ({
  _id: '1',
  name: 'Alabama',
  displayName: 'Alabama Crimson Tide',
  shortDisplayName: 'Alabama',
  abbreviation: 'ALA',
  logo: '',
  color: '000000',
  alternateColor: 'ffffff',
  conferenceId: 'SEC',
  division: null,
  record: { overall: '0-0', conference: '0-0', home: '0-0', away: '0-0', stats: {} },
  conferenceStanding: '',
  ...overrides,
});

const makeSp = (team: string, rating: number, ranking?: number): TeamSP =>
  ({ team, rating, ranking: ranking ?? undefined }) as unknown as TeamSP;

describe('attachSpPlusToTeams', () => {
  it('uses ranking when available instead of rating', () => {
    const teams = [makeTeam({ name: 'Alabama' })];
    const result = attachSpPlusToTeams(teams, [makeSp('Alabama', 25.5, 3)]);
    expect(result[0].spPlusRating).toBe(3);
  });

  it('falls back to rating when ranking is null', () => {
    const teams = [makeTeam({ name: 'Alabama' })];
    const result = attachSpPlusToTeams(teams, [makeSp('Alabama', 25.5)]);
    expect(result[0].spPlusRating).toBe(25.5);
  });

  it('matches name variations including State to St', () => {
    const teams = [makeTeam({ name: 'Mississippi State' })];
    const result = attachSpPlusToTeams(teams, [makeSp('Mississippi State', 15.0, 20)]);
    expect(result[0].spPlusRating).toBe(20);
  });

  it('returns undefined spPlusRating for all teams when ratings are empty', () => {
    const teams = [makeTeam()];
    const result = attachSpPlusToTeams(teams, []);
    expect(result[0].spPlusRating).toBeUndefined();
  });
});
