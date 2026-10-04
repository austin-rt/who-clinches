import { TTL_NO_EXPIRY, ttlLeft } from '@/lib/format-time';

const TTL_OF_A_MISSING_KEY = -2;

describe('ttlLeft', () => {
  it('reports a key with no expiry as never expiring', () => {
    expect(ttlLeft(TTL_NO_EXPIRY)).toBe('never');
  });

  it('reports a key that was gone by the time its ttl was read as expired', () => {
    expect(ttlLeft(TTL_OF_A_MISSING_KEY)).toBe('expired');
  });
});
