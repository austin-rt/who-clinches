export const getFixtureYear = (): number | null => {
  if (process.env.FIXTURE_YEAR) {
    return parseInt(process.env.FIXTURE_YEAR, 10);
  }
  return null;
};
