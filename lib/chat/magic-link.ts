import { db } from '@/lib/db/client';
import { sendEmail } from '@/lib/email';
import { magicLinkHtml } from '@/lib/email-templates';

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
  const baseUrl =
    process.env.VERCEL_ENV === 'production'
      ? 'https://whoclinches.com'
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Claim your credits — Who Clinches',
    html: magicLinkHtml(verifyUrl),
  });
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
