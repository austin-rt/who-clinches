import { describeErrorCause, logError } from '@/lib/errorLogger';

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

describe('logError output', () => {
  const original = console.error;
  let lines: string[];

  beforeEach(() => {
    lines = [];
    console.error = (line: string) => lines.push(line);
  });

  afterEach(() => {
    console.error = original;
  });

  it('includes the cause alongside the message when one exists', async () => {
    const cause = Object.assign(new Error('getaddrinfo ENOTFOUND redis.invalid'), {
      code: 'ENOTFOUND',
    });

    await logError(new Error('fetch failed', { cause }), { action: 'redis-get' });

    const logged = JSON.parse(lines[0]);
    expect(logged.error).toBe('fetch failed');
    expect(logged.cause).toContain('ENOTFOUND');
    expect(logged.action).toBe('redis-get');
  });

  it('omits the cause key entirely when there is none', async () => {
    await logError(new Error('plain'), { action: 'x' });

    expect(JSON.parse(lines[0])).not.toHaveProperty('cause');
  });

  it('stringifies a thrown non-error value', async () => {
    await logError('boom');

    expect(JSON.parse(lines[0]).error).toBe('boom');
  });
});
