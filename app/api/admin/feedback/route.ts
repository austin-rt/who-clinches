import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const feedback = await db.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return Response.json({ feedback });
  } catch {
    return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const { id, resolved } = await request.json();
    const updated = await db.feedback.update({
      where: { id },
      data: { resolved },
    });
    return Response.json(updated);
  } catch {
    return Response.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { id } = await request.json();
    await db.feedback.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
};
