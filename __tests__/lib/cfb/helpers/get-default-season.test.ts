import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';

jest.mock('@/lib/cfb/helpers/fixture-year', () => ({
  getFixtureYear: jest.fn().mockResolvedValue(null),
  isFixtureDataSource: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/helpers/get-default-season', () => ({
  getDefaultSeason: jest.fn().mockResolvedValue(2026),
}));

describe('getDefaultSeasonFromCfbd', () => {
  const mockGetDefaultSeason = jest.mocked(
    jest.requireMock<typeof import('@/lib/helpers/get-default-season')>(
      '@/lib/helpers/get-default-season'
    ).getDefaultSeason
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetDefaultSeason.mockResolvedValue(2026);
  });

  it('delegates to shared getDefaultSeason', async () => {
    const result = await getDefaultSeasonFromCfbd();
    expect(result).toBe(2026);
    expect(mockGetDefaultSeason).toHaveBeenCalled();
  });

  it('returns whatever season the shared function returns', async () => {
    mockGetDefaultSeason.mockResolvedValue(2025);
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
      expect(mockGetDefaultSeason).not.toHaveBeenCalled();
    });

    it('falls through to shared function when fixture year returns null', async () => {
      process.env.FIXTURE_YEAR = '2024';
      mockGetFixtureYear.mockResolvedValue(null);

      const result = await getDefaultSeasonFromCfbd();

      expect(result).toBe(2026);
      expect(mockGetDefaultSeason).toHaveBeenCalled();
    });

    it('ignores fixture year when FIXTURE_YEAR env var is not set', async () => {
      mockGetFixtureYear.mockResolvedValue(2024);

      const result = await getDefaultSeasonFromCfbd();

      expect(result).not.toBe(2024);
      expect(mockGetDefaultSeason).toHaveBeenCalled();
    });
  });
});
