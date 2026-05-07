import { calculateNextWeekdayRevalidate } from '@/lib/cfb/helpers/calculate-next-weekday-revalidate';

describe('calculateNextWeekdayRevalidate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns seconds until later today when same day before target hour', () => {
    jest.setSystemTime(new Date('2025-09-06T10:00:00-04:00'));
    const result = calculateNextWeekdayRevalidate(6, 11, 'America/New_York');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(2 * 60 * 60);
  });

  it('returns seconds until next week when same day after target hour', () => {
    jest.setSystemTime(new Date('2025-09-06T15:00:00-04:00'));
    const result = calculateNextWeekdayRevalidate(6, 11, 'America/New_York');
    expect(result).toBeGreaterThan(5 * 24 * 60 * 60);
  });

  it('calculates correct daysUntil for different day', () => {
    jest.setSystemTime(new Date('2025-09-03T10:00:00-04:00'));
    const result = calculateNextWeekdayRevalidate(6, 11, 'America/New_York');
    expect(result).toBeGreaterThan(2 * 24 * 60 * 60);
    expect(result).toBeLessThan(4 * 24 * 60 * 60);
  });

  it('clamps result to [1, 8 days]', () => {
    const result = calculateNextWeekdayRevalidate(6, 11, 'America/New_York');
    const maxSeconds = 8 * 24 * 60 * 60;
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(maxSeconds);
  });
});
