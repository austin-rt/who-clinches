'use client';

import { useState, useEffect, useCallback } from 'react';

const formatCountdown = (resetsAt: number): string => {
  const diff = resetsAt - Date.now();
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const useCountdown = (resetsAt: number | null, onExpire: () => void) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!resetsAt) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [resetsAt]);

  void tick;
  const countdown = resetsAt ? formatCountdown(resetsAt) : '';

  const stableOnExpire = useCallback(() => onExpire(), [onExpire]);

  useEffect(() => {
    if (!resetsAt) return;
    if (resetsAt - Date.now() <= 0) {
      const id = requestAnimationFrame(() => stableOnExpire());
      return () => cancelAnimationFrame(id);
    }
  }, [resetsAt, tick, stableOnExpire]);

  return countdown;
};
