import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'cadm';
const MAX_AGE = 30 * 24 * 60 * 60;

const getSecret = (): string => {
  const secret = process.env.CHAT_IDENTITY_SECRET;
  if (!secret) throw new Error('CHAT_IDENTITY_SECRET is not set');
  return secret;
};

const sign = (payload: string): string => {
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex').slice(0, 16);
  return `${payload}.${sig}`;
};

const verify = (value: string): boolean => {
  const dot = value.lastIndexOf('.');
  if (dot === -1) return false;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac('sha256', getSecret()).update(payload).digest('hex').slice(0, 16);
  return sig === expected && payload === 'admin';
};

export const isChatAdmin = (request: NextRequest): boolean => {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return verify(cookie);
};

export const buildAdminCookieHeader = (): string => {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  return `${COOKIE_NAME}=${sign('admin')}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}${secure}`;
};

export const buildAdminClearCookieHeader = (): string => {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
};
