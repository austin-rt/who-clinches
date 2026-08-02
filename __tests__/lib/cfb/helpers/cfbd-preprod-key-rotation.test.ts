import {
  selectActiveApiKey,
  applyPreprodKeyRotationPolicy,
  CFBD_PREPROD_ROTATION_THRESHOLD,
} from '@/lib/cfb/helpers/cfbd-preprod-key-rotation';

describe('selectActiveApiKey', () => {
  it('returns the first key when deployed, regardless of active index', () => {
    expect(selectActiveApiKey(['first', 'second'], true, 1)).toBe('first');
  });

  it('returns the rotating key when running locally', () => {
    expect(selectActiveApiKey(['first', 'second'], false, 1)).toBe('second');
  });
});

describe('applyPreprodKeyRotationPolicy', () => {
  const baseInput = {
    poolLength: 2,
    activeIndex: 0,
    usageByIndex: new Map(),
    remainingCallsForActiveKey: 0,
    threshold: CFBD_PREPROD_ROTATION_THRESHOLD,
    now: 1_000,
  };

  it('never rotates when deployed', () => {
    const result = applyPreprodKeyRotationPolicy({ ...baseInput, isDeployedOnVercel: true });

    expect(result).toEqual({ kind: 'no_attempt' });
  });

  it('rotates to the next key locally once the active key is exhausted', () => {
    const result = applyPreprodKeyRotationPolicy({ ...baseInput, isDeployedOnVercel: false });

    expect(result.kind).toBe('applied');
    expect(result.kind === 'applied' && result.nextActiveIndex).toBe(1);
  });

  it('keeps the active key locally while it is above the threshold', () => {
    const result = applyPreprodKeyRotationPolicy({
      ...baseInput,
      isDeployedOnVercel: false,
      remainingCallsForActiveKey: CFBD_PREPROD_ROTATION_THRESHOLD,
    });

    expect(result.kind === 'applied' && result.nextActiveIndex).toBe(0);
  });

  it('does not attempt rotation with a single-key pool', () => {
    const result = applyPreprodKeyRotationPolicy({
      ...baseInput,
      isDeployedOnVercel: false,
      poolLength: 1,
    });

    expect(result).toEqual({ kind: 'no_attempt' });
  });
});
