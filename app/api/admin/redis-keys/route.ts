import { NextRequest, NextResponse } from 'next/server';
import { isAdminAllowed } from '@/lib/admin/is-admin-allowed';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not configured in this environment' },
      { status: 400 }
    );
  }

  try {
    const keys: string[] = [];
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { count: 100 });
      cursor = Number(result[0]);
      keys.push(...result[1]);
    } while (cursor !== 0);

    if (keys.length === 0) {
      return NextResponse.json({ keys: [], count: 0 });
    }

    const ttlPipeline = redis.pipeline();
    const valPipeline = redis.pipeline();
    for (const key of keys) {
      ttlPipeline.ttl(key);
      valPipeline.get(key);
    }
    const ttls = (await ttlPipeline.exec()) as number[];
    const vals = await valPipeline.exec();

    const entries = keys.map((key, i) => {
      const val = vals[i] as { cachedAt?: number } | null;
      return {
        key,
        ttl: ttls[i],
        cachedAt: val?.cachedAt ?? null,
      };
    });

    return NextResponse.json({ keys: entries, count: entries.length });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: NextRequest) => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not configured in this environment' },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { pattern?: string; keys?: string[] };

  try {
    let deletedCount = 0;

    if (body.keys && body.keys.length > 0) {
      const pipeline = redis.pipeline();
      for (const key of body.keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
      deletedCount = body.keys.length;
    } else if (body.pattern) {
      const keys: string[] = [];
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, {
          match: body.pattern,
          count: 100,
        });
        cursor = Number(result[0]);
        keys.push(...result[1]);
      } while (cursor !== 0);

      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        for (const key of keys) {
          pipeline.del(key);
        }
        await pipeline.exec();
        deletedCount = keys.length;
      }
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to delete keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
};
