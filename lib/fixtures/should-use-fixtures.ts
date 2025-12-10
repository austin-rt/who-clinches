export const shouldUseFixtures = (): boolean => {
  return process.env.USE_FIXTURES === 'true' || process.env.NODE_ENV === 'test';
};

