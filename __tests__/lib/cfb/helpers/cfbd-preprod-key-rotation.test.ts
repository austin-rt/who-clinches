import {
  CFBD_PREPROD_ROTATION_THRESHOLD,
  applyPreprodKeyRotationPolicy,
  selectActiveApiKey,
} from '@/lib/cfb/helpers/cfbd-preprod-key-rotation';

describe('selectActiveApiKey', () => {
  const pool = ['first', 'second'];

  it('returns empty string when pool is empty', () => {
    expect(selectActiveApiKey([], 'preview', 0)).toBe('');
  });

  it('returns first key in production regardless of active index', () => {
    expect(selectActiveApiKey(pool, 'production', 1)).toBe('first');
  });

  it('returns pool entry at active index when not production', () => {
    expect(selectActiveApiKey(pool, 'preview', 1)).toBe('second');
    expect(selectActiveApiKey(pool, undefined, 0)).toBe('first');
  });
});

describe('applyPreprodKeyRotationPolicy', () => {
  const threshold = CFBD_PREPROD_ROTATION_THRESHOLD;
  const now = 1_700_000_000_000;

  it('returns no_attempt in production even with multiple keys', () => {
    expect(
      applyPreprodKeyRotationPolicy({
        vercelEnv: 'production',
        poolLength: 2,
        activeIndex: 0,
        usageByIndex: new Map(),
        remainingCallsForActiveKey: 0,
        threshold,
        now,
      }),
    ).toEqual({ kind: 'no_attempt' });
  });

  it('returns no_attempt when pool has at most one key', () => {
    expect(
      applyPreprodKeyRotationPolicy({
        vercelEnv: 'preview',
        poolLength: 1,
        activeIndex: 0,
        usageByIndex: new Map([[0, { remainingCalls: 100, timestamp: 0 }]]),
        remainingCallsForActiveKey: 0,
        threshold,
        now,
      }),
    ).toEqual({ kind: 'no_attempt' });

    expect(
      applyPreprodKeyRotationPolicy({
        vercelEnv: 'preview',
        poolLength: 0,
        activeIndex: 0,
        usageByIndex: new Map(),
        remainingCallsForActiveKey: 0,
        threshold,
        now,
      }),
    ).toEqual({ kind: 'no_attempt' });
  });

  it('records usage and keeps index when remaining calls are at or above threshold', () => {
    const usageByIndex = new Map([
      [0, { remainingCalls: threshold, timestamp: 0 }],
      [1, { remainingCalls: threshold - 1, timestamp: 0 }],
    ]);
    const result = applyPreprodKeyRotationPolicy({
      vercelEnv: 'preview',
      poolLength: 2,
      activeIndex: 0,
      usageByIndex,
      remainingCallsForActiveKey: threshold,
      threshold,
      now,
    });

    expect(result).toMatchObject({
      kind: 'applied',
      nextActiveIndex: 0,
      logAllKeysExhausted: false,
    });
    if (result.kind !== 'applied') throw new Error('expected applied');
    expect(result.nextUsageByIndex.get(0)).toEqual({
      remainingCalls: threshold,
      timestamp: now,
    });
  });

  it('switches to alternate key when active is below threshold and alternate has no usage yet', () => {
    const usageByIndex = new Map<number, { remainingCalls: number; timestamp: number }>([
      [0, { remainingCalls: threshold, timestamp: 0 }],
    ]);
    const result = applyPreprodKeyRotationPolicy({
      vercelEnv: 'preview',
      poolLength: 2,
      activeIndex: 0,
      usageByIndex,
      remainingCallsForActiveKey: threshold - 1,
      threshold,
      now,
    });

    expect(result).toMatchObject({
      kind: 'applied',
      nextActiveIndex: 1,
      logAllKeysExhausted: false,
    });
  });

  it('switches to alternate key when alternate usage is at or above threshold', () => {
    const usageByIndex = new Map([
      [0, { remainingCalls: threshold, timestamp: 0 }],
      [1, { remainingCalls: threshold, timestamp: 0 }],
    ]);
    const result = applyPreprodKeyRotationPolicy({
      vercelEnv: 'preview',
      poolLength: 2,
      activeIndex: 0,
      usageByIndex,
      remainingCallsForActiveKey: threshold - 1,
      threshold,
      now,
    });

    expect(result).toMatchObject({
      kind: 'applied',
      nextActiveIndex: 1,
      logAllKeysExhausted: false,
    });
  });

  it('sets logAllKeysExhausted when every alternate is below threshold', () => {
    const usageByIndex = new Map([
      [0, { remainingCalls: threshold, timestamp: 0 }],
      [1, { remainingCalls: threshold - 1, timestamp: 0 }],
      [2, { remainingCalls: threshold - 1, timestamp: 0 }],
    ]);
    const result = applyPreprodKeyRotationPolicy({
      vercelEnv: 'preview',
      poolLength: 3,
      activeIndex: 0,
      usageByIndex,
      remainingCallsForActiveKey: threshold - 1,
      threshold,
      now,
    });

    expect(result).toMatchObject({
      kind: 'applied',
      nextActiveIndex: 0,
      logAllKeysExhausted: true,
    });
    if (result.kind !== 'applied') throw new Error('expected applied');
    expect(result.nextUsageByIndex.get(0)?.remainingCalls).toBe(threshold - 1);
  });
});
