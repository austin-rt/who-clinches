import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';
import { getCalendarFromCfbd } from '@/lib/cfb/cfbd-rest-client';
import { createMockCalendarWeek } from '@/__tests__/mocks/cfbd-rest-client';

jest.mock('@/lib/cfb/cfbd-rest-client', () => ({
  getCalendarFromCfbd: jest.fn(),
}));

jest.mock('@/lib/cfb/helpers/fixture-year', () => ({
  getFixtureYear: jest.fn().mockResolvedValue(null),
  isFixtureDataSource: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

describe('getDefaultSeasonFromCfbd', () => {
  const mockGetCalendar = jest.mocked(getCalendarFromCfbd);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns current year when CFBD has calendar data', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    mockGetCalendar.mockResolvedValue([createMockCalendarWeek({ season: 2026, week: 1 })]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2026);
    expect(mockGetCalendar).toHaveBeenCalledWith(2026);
  });

  it('returns previous year when CFBD has no calendar for current year', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-10T12:00:00Z'));
    mockGetCalendar.mockResolvedValue([]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2025);
  });

  it('returns previous year when CFBD API throws', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    mockGetCalendar.mockRejectedValue(new Error('API Error'));

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2025);
  });

  describe('fixture year branch', () => {
    const mockGetFixtureYear = jest.mocked(
      jest.requireMock<typeof import('@/lib/cfb/helpers/fixture-year')>(
        '@/lib/cfb/helpers/fixture-year'
      ).getFixtureYear
    );

    afterEach(() => {
      delete process.env.FIXTURE_YEAR;
    });

    it('returns fixture year when FIXTURE_YEAR env var is set', async () => {
      process.env.FIXTURE_YEAR = '2024';
      mockGetFixtureYear.mockResolvedValue(2024);

      const result = await getDefaultSeasonFromCfbd();

      expect(result).toBe(2024);
      expect(mockGetCalendar).not.toHaveBeenCalled();
    });

    it('ignores fixture year when FIXTURE_YEAR env var is not set', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));
      mockGetFixtureYear.mockResolvedValue(2024);
      mockGetCalendar.mockResolvedValue([createMockCalendarWeek({ season: 2026, week: 1 })]);

      const result = await getDefaultSeasonFromCfbd();

      expect(result).not.toBe(2024);
      expect(mockGetCalendar).toHaveBeenCalled();
    });
  });
});
