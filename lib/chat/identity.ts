import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'cid';
const MAX_AGE = 365 * 24 * 60 * 60;

const getSecret = (): string => {
  const secret = process.env.CHAT_IDENTITY_SECRET;
  if (!secret) throw new Error('CHAT_IDENTITY_SECRET is not set');
  return secret;
};

export const signId = (id: string): string => {
  const sig = createHmac('sha256', getSecret()).update(id).digest('hex').slice(0, 16);
  return `${id}.${sig}`;
};

export const verifyId = (value: string): string | null => {
  const dot = value.lastIndexOf('.');
  if (dot === -1) return null;
  const id = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac('sha256', getSecret()).update(id).digest('hex').slice(0, 16);
  return sig === expected ? id : null;
};

export const getOrCreateChatIdentity = (
  request: NextRequest
): {
  chatUserId: string;
  setCookie: boolean;
} => {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing) {
    const verified = verifyId(existing);
    if (verified) return { chatUserId: verified, setCookie: false };
  }
  const id = crypto.randomUUID();
  return { chatUserId: id, setCookie: true };
};

export const buildCookieHeader = (chatUserId: string): string => {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  return `${COOKIE_NAME}=${signId(chatUserId)}; HttpOnly; SameSite=Lax; Path=/api/chat; Max-Age=${MAX_AGE}${secure}`;
};
