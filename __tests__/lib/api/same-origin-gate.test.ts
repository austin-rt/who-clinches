import { checkSameOrigin } from '@/lib/api/same-origin-gate';
import { NextRequest } from 'next/server';

const makeRequest = (headers: Record<string, string>): NextRequest => {
  const url = `http://${headers.host || 'test.com'}/api/test`;
  return new NextRequest(new Request(url, { headers }));
};

describe('checkSameOrigin', () => {
  it('returns 403 when no host header', () => {
    const req = new NextRequest(new Request('http://test.com/api/test'));
    const result = checkSameOrigin(req);
    expect(result?.status).toBe(403);
  });

  it('returns null for matching origin hostname', () => {
    const req = makeRequest({ host: 'example.com', origin: 'https://example.com' });
    expect(checkSameOrigin(req)).toBeNull();
  });

  it('returns 403 for mismatched origin', () => {
    const req = makeRequest({ host: 'example.com', origin: 'https://evil.com' });
    const result = checkSameOrigin(req);
    expect(result?.status).toBe(403);
  });

  it('allows localhost origin', () => {
    const req = makeRequest({ host: 'example.com', origin: 'http://localhost:3000' });
    expect(checkSameOrigin(req)).toBeNull();
  });

  it('returns 403 for invalid origin URL', () => {
    const req = makeRequest({ host: 'example.com', origin: 'not-a-url' });
    const result = checkSameOrigin(req);
    expect(result?.status).toBe(403);
  });

  it('returns null for matching referer when no origin', () => {
    const req = makeRequest({ host: 'example.com', referer: 'https://example.com/page' });
    expect(checkSameOrigin(req)).toBeNull();
  });

  it('returns 403 for mismatched referer when no origin', () => {
    const req = makeRequest({ host: 'example.com', referer: 'https://evil.com/page' });
    const result = checkSameOrigin(req);
    expect(result?.status).toBe(403);
  });

  it('returns 403 when neither origin nor referer', () => {
    const req = makeRequest({ host: 'example.com' });
    const result = checkSameOrigin(req);
    expect(result?.status).toBe(403);
  });

  it('strips port from host for comparison', () => {
    const req = makeRequest({ host: 'localhost:3000', origin: 'http://localhost' });
    expect(checkSameOrigin(req)).toBeNull();
  });
});
