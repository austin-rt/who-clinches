import { calculateTurnoverMarginFromStats } from '@/lib/cfb/helpers/calculate-turnover-margin';
import type { TeamStat } from 'cfbd';

const makeStat = (team: string, statName: string, statValue: number | string): TeamStat =>
  ({ team, statName, statValue }) as unknown as TeamStat;

describe('calculateTurnoverMarginFromStats', () => {
  it('calculates correct margin (turnoversOpponent - turnovers)', () => {
    const stats = [
      makeStat('Alabama', 'turnovers', 10),
      makeStat('Alabama', 'turnoversOpponent', 18),
    ];
    const result = calculateTurnoverMarginFromStats(stats);
    expect(result.get('Alabama')).toBe(8);
  });

  it('handles string stat values via parseFloat', () => {
    const stats = [
      makeStat('Alabama', 'turnovers', '12'),
      makeStat('Alabama', 'turnoversOpponent', '7'),
    ];
    const result = calculateTurnoverMarginFromStats(stats);
    expect(result.get('Alabama')).toBe(-5);
  });

  it('returns null when turnovers stat is missing', () => {
    const stats = [makeStat('Alabama', 'turnoversOpponent', 18)];
    const result = calculateTurnoverMarginFromStats(stats);
    expect(result.get('Alabama')).toBeNull();
  });

  it('returns null when turnoversOpponent stat is missing', () => {
    const stats = [makeStat('Alabama', 'turnovers', 10)];
    const result = calculateTurnoverMarginFromStats(stats);
    expect(result.get('Alabama')).toBeNull();
  });

  it('filters out NaN stat values', () => {
    const stats = [
      makeStat('Alabama', 'turnovers', 'invalid'),
      makeStat('Alabama', 'turnoversOpponent', 18),
    ];
    const result = calculateTurnoverMarginFromStats(stats);
    expect(result.get('Alabama')).toBeNull();
  });
});
