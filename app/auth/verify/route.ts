import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { verifyMagicLink, claimPendingDonations } from '@/lib/chat/magic-link';
import { getOrCreateChatIdentity, buildCookieHeader } from '@/lib/chat/identity';

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/?auth=invalid', request.url));
  }

  const email = await verifyMagicLink(token);
  if (!email) {
    return NextResponse.redirect(new URL('/?auth=expired', request.url));
  }

  const { chatUserId, setCookie } = getOrCreateChatIdentity(request);

  const existingByEmail = await db.chatUser.findUnique({ where: { email } });

  let chatUser;
  if (existingByEmail) {
    chatUser = existingByEmail;
  } else {
    chatUser = await db.chatUser.upsert({
      where: { anonymousId: chatUserId },
      create: { anonymousId: chatUserId, email },
      update: { email },
    });
  }

  const credited = await claimPendingDonations(email, chatUser.id);

  const referer = request.headers.get('referer');
  const redirectUrl = new URL(referer ?? '/', request.url);
  redirectUrl.searchParams.set('auth', 'success');
  if (credited > 0) {
    redirectUrl.searchParams.set('credited', String(credited));
  }

  const response = NextResponse.redirect(redirectUrl);
  if (setCookie || existingByEmail) {
    response.headers.append('Set-Cookie', buildCookieHeader(chatUser.anonymousId));
  }

  return response;
};
