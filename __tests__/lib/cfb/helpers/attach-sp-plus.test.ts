import { attachSpPlusToTeams } from '@/lib/cfb/helpers/attach-sp-plus';
import { TeamLean } from '@/lib/types';
import type { TeamSP } from 'cfbd';
import { createTeamLean } from '../../../api/cfb/tiebreaker-rules/common/test-helpers';

const makeTeam = (overrides: Partial<TeamLean> = {}): TeamLean => ({
  ...createTeamLean({ teamId: '1', abbrev: 'ALA', conferenceId: 'SEC' }),
  name: 'Alabama',
  displayName: 'Alabama Crimson Tide',
  shortDisplayName: 'Alabama',
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
