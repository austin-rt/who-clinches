import { db } from '@/lib/db/client';

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export const createMagicLink = async (email: string): Promise<string> => {
  const token = crypto.randomUUID();
  await db.magicLink.create({
    data: {
      token,
      email: email.toLowerCase().trim(),
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    },
  });
  return token;
};

export const verifyMagicLink = async (token: string): Promise<string | null> => {
  const link = await db.magicLink.findUnique({ where: { token } });
  if (!link) return null;
  if (link.usedAt) return null;
  if (link.expiresAt < new Date()) return null;

  await db.magicLink.update({
    where: { id: link.id },
    data: { usedAt: new Date() },
  });

  return link.email;
};

export const sendMagicLinkEmail = async (email: string, token: string): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const baseUrl =
    process.env.VERCEL_ENV === 'production'
      ? 'https://whoclinches.com'
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'whoclinches <noreply@whoclinches.com>',
      to: email,
      subject: 'Sign in to whoclinches.com',
      text: [
        'Click the link below to sign in and manage your chat credits:',
        '',
        verifyUrl,
        '',
        'This link expires in 15 minutes.',
        '',
        "If you didn't request this, you can ignore this email.",
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send magic link email: ${res.status} ${body}`);
  }
};

export const claimPendingDonations = async (email: string, chatUserId: string): Promise<number> => {
  const normalizedEmail = email.toLowerCase().trim();
  const unclaimed = await db.donation.findMany({
    where: { email: normalizedEmail, chatUserId: null },
  });

  if (unclaimed.length === 0) return 0;

  const totalCredits = unclaimed.reduce((sum, d) => sum + d.credits, 0);

  await db.$transaction([
    db.donation.updateMany({
      where: { id: { in: unclaimed.map((d) => d.id) } },
      data: { chatUserId },
    }),
    db.chatUser.update({
      where: { id: chatUserId },
      data: { purchasedCredits: { increment: totalCredits } },
    }),
  ]);

  return totalCredits;
};
