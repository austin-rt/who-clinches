import { NextRequest, NextResponse } from 'next/server';
import { buildAdminCookieHeader, buildAdminClearCookieHeader } from '@/lib/admin/chat-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request: NextRequest) => {
  const secret = process.env.CHAT_MAINTAINER_PASSPHRASE;
  const provided = request.nextUrl.searchParams.get('key');

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, elevated: true });
  response.headers.set('Set-Cookie', buildAdminCookieHeader());
  return response;
};

export const DELETE = (request: NextRequest) => {
  const secret = process.env.CHAT_MAINTAINER_PASSPHRASE;
  const provided = request.nextUrl.searchParams.get('key');

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, elevated: false });
  response.headers.set('Set-Cookie', buildAdminClearCookieHeader());
  return response;
};
