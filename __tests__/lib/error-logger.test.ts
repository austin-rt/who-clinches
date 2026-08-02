import { describeErrorCause } from '@/lib/errorLogger';

describe('describeErrorCause', () => {
  it('surfaces the errno code that undici hides under fetch failed', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3001'), {
      code: 'ECONNREFUSED',
    });

    expect(describeErrorCause(new Error('fetch failed', { cause }))).toBe(
      'Error: connect ECONNREFUSED 127.0.0.1:3001 (ECONNREFUSED)'
    );
  });

  it('describes an error cause that carries no errno code', () => {
    const cause = new Error('terminated');

    expect(describeErrorCause(new Error('fetch failed', { cause }))).toBe('Error: terminated');
  });

  it('stringifies a non-error cause', () => {
    expect(describeErrorCause(new Error('boom', { cause: 'upstream timeout' }))).toBe(
      'upstream timeout'
    );
  });

  it('returns undefined when there is no cause to report', () => {
    expect(describeErrorCause(new Error('plain'))).toBeUndefined();
  });

  it('returns undefined for a thrown non-error value', () => {
    expect(describeErrorCause('just a string')).toBeUndefined();
  });
});
