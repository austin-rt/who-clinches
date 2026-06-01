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

  it('returns current year from April onward without checking calendar', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T12:00:00Z'));

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2026);
    expect(mockGetCalendar).not.toHaveBeenCalled();
  });

  it('returns current year in September without checking calendar', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-09-15T12:00:00Z'));

    mockGetCalendar.mockResolvedValue([createMockCalendarWeek({ season: 2025, week: 1 })]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2025);
    expect(mockGetCalendar).not.toHaveBeenCalled();
  });

  it('checks calendar in January and returns current year when available', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-10T12:00:00Z'));

    mockGetCalendar.mockResolvedValue([createMockCalendarWeek({ season: 2026, week: 1 })]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2026);
    expect(mockGetCalendar).toHaveBeenCalledWith(2026);
  });

  it('falls back to previous year in January when calendar is empty', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-15T12:00:00Z'));

    mockGetCalendar.mockResolvedValue([]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2025);
  });

  it('falls back to default season when API throws in early months', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-01T12:00:00Z'));

    mockGetCalendar.mockRejectedValue(new Error('API Error'));

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(2026);
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
      mockGetFixtureYear.mockResolvedValue(2024);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-15T12:00:00Z'));

      mockGetCalendar.mockResolvedValue([createMockCalendarWeek({ season: 2026, week: 1 })]);

      const result = await getDefaultSeasonFromCfbd();

      expect(result).not.toBe(2024);
      expect(mockGetCalendar).toHaveBeenCalled();
    });
  });
});
