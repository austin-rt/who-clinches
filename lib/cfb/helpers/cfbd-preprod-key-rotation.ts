export const CFBD_PREPROD_ROTATION_THRESHOLD = 5;

export type PreprodKeyUsage = {
  remainingCalls: number;
  timestamp: number;
};

export type PreprodKeyRotationPolicyResult =
  | { kind: 'no_attempt' }
  | {
      kind: 'applied';
      nextUsageByIndex: Map<number, PreprodKeyUsage>;
      nextActiveIndex: number;
      logAllKeysExhausted: boolean;
    };

export const parseCfbdApiKeyPool = (cfbdApiKeyEnv: string | undefined): string[] =>
  (cfbdApiKeyEnv ?? '').split(',').filter(Boolean);

export const selectActiveApiKey = (
  pool: readonly string[],
  isDeployedOnVercel: boolean,
  activePreprodKeyIndex: number
): string => {
  if (pool.length === 0) {
    return '';
  }
  if (isDeployedOnVercel) {
    return pool[0];
  }
  return pool[activePreprodKeyIndex];
};

export const applyPreprodKeyRotationPolicy = (input: {
  isDeployedOnVercel: boolean;
  poolLength: number;
  activeIndex: number;
  usageByIndex: ReadonlyMap<number, PreprodKeyUsage>;
  remainingCallsForActiveKey: number;
  threshold: number;
  now: number;
}): PreprodKeyRotationPolicyResult => {
  const {
    isDeployedOnVercel,
    poolLength,
    activeIndex,
    usageByIndex,
    remainingCallsForActiveKey,
    threshold,
    now,
  } = input;

  if (isDeployedOnVercel || poolLength <= 1) {
    return { kind: 'no_attempt' };
  }

  const nextUsageByIndex = new Map(usageByIndex);
  nextUsageByIndex.set(activeIndex, {
    remainingCalls: remainingCallsForActiveKey,
    timestamp: now,
  });

  if (remainingCallsForActiveKey >= threshold) {
    return {
      kind: 'applied',
      nextUsageByIndex,
      nextActiveIndex: activeIndex,
      logAllKeysExhausted: false,
    };
  }

  for (let i = 0; i < poolLength; i++) {
    if (i === activeIndex) continue;
    const usage = nextUsageByIndex.get(i);
    if (!usage || usage.remainingCalls >= threshold) {
      return {
        kind: 'applied',
        nextUsageByIndex,
        nextActiveIndex: i,
        logAllKeysExhausted: false,
      };
    }
  }

  return {
    kind: 'applied',
    nextUsageByIndex,
    nextActiveIndex: activeIndex,
    logAllKeysExhausted: true,
  };
};
