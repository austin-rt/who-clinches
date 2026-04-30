import { NextRequest, NextResponse } from 'next/server';

/**
 * Rejects requests whose Origin (or Referer fallback) doesn't match the
 * deployment host. Returns a 403 NextResponse if the check fails, or null
 * if the request is allowed.
 */
export const checkSameOrigin = (request: NextRequest): NextResponse<{ error: string }> | null => {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const normalizedHost = host.replace(/:\d+$/, '');

  if (origin) {
    try {
      const originHost = new URL(origin).hostname;
      if (originHost === normalizedHost || originHost === 'localhost') {
        return null;
      }
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (referer) {
    try {
      const refererHost = new URL(referer).hostname;
      if (refererHost === normalizedHost || refererHost === 'localhost') {
        return null;
      }
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (!origin && !referer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
};
