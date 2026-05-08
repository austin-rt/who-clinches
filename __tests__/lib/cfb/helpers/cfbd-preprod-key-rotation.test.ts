import { selectActiveApiKey } from '@/lib/cfb/helpers/cfbd-preprod-key-rotation';

describe('selectActiveApiKey', () => {
  it('returns first key in production regardless of active index', () => {
    expect(selectActiveApiKey(['first', 'second'], 'production', 1)).toBe('first');
  });
});
