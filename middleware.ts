import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkSameOrigin } from '@/lib/api/same-origin-gate';
import { findNearestTeam } from '@/lib/geo/nearest-team';

const CONF_SLUG_TO_CFBD: Record<string, string> = {
  sec: 'SEC',
  acc: 'ACC',
  b1g: 'B1G',
  big12: 'B12',
  pac12: 'PAC',
  aac: 'AAC',
  mac: 'MAC',
  cusa: 'CUSA',
  mw: 'MWC',
  sunbelt: 'SBC',
};

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit',
});

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const vercelEnv = process.env.VERCEL_ENV;

  const isPageRoute = !pathname.startsWith('/api') && !pathname.startsWith('/admin');

  if (isPageRoute) {
    const lat = request.headers.get('x-vercel-ip-latitude');
    const lon = request.headers.get('x-vercel-ip-longitude');

    if (lat && lon) {
      const segments = pathname.split('/');
      const confSlug = segments[2];
      const conference = confSlug ? CONF_SLUG_TO_CFBD[confSlug] : undefined;
      const nearest = findNearestTeam(parseFloat(lat), parseFloat(lon), conference);

      if (nearest) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-geo-team', nearest.school);
        requestHeaders.set('x-geo-team-id', nearest.teamId);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }

    return NextResponse.next();
  }

  if (vercelEnv !== 'production' && vercelEnv !== 'preview') {
    return NextResponse.next();
  }

  const hasBypassToken =
    request.nextUrl.searchParams.get('x-vercel-protection-bypass') ===
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  if (!hasBypassToken) {
    const originCheck = checkSameOrigin(request);
    if (originCheck) return originCheck;
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (vercelEnv === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.next();
  }

  if (hasBypassToken) return NextResponse.next();

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  return response;
};

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/:sport/:conf'],
};
