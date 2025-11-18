'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';

/**
 * Generic hook that syncs Redux state with localStorage
 * Handles hydration on mount (read from localStorage → dispatch to Redux)
 * Handles persistence on change (Redux change → write to localStorage)
 *
 * @param key - localStorage key
 * @param defaultValue - Default value if not in localStorage
 * @param action - Redux action creator to dispatch
 * @param selector - Redux selector to get current state value
 * @returns [value, setValue] similar to useState
 */
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T,
  action: ActionCreatorWithPayload<T>,
  selector: (state: ReturnType<typeof import('../store/store').store.getState>) => T
): [T, (value: T) => void] => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selector);

  // Hydration: Read from localStorage on mount and dispatch to Redux
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        // Parse stored value
        let parsedValue: T;
        try {
          // Try JSON parse first (for objects, arrays, booleans, numbers)
          parsedValue = JSON.parse(stored) as T;
        } catch {
          // If JSON parse fails, treat as string (for backward compatibility with existing string values)
          parsedValue = stored as unknown as T;
        }
        dispatch(action(parsedValue));
      } else {
        // No stored value, set default
        // Store as JSON for complex types, or as string for simple strings
        const valueToStore =
          typeof defaultValue === 'string' ? defaultValue : JSON.stringify(defaultValue);
        localStorage.setItem(key, valueToStore);
        dispatch(action(defaultValue));
      }
    } catch {
      // localStorage unavailable (SSR, private browsing, etc.)
      // Just use default value
      dispatch(action(defaultValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Persistence: Write to localStorage when Redux state changes
  useEffect(() => {
    try {
      // Store as JSON for complex types, or as string for simple strings
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, valueToStore);
    } catch {
      // localStorage unavailable - silently fail
      // No need to log - this is expected in some environments
    }
  }, [key, value]);

  // setValue function that dispatches to Redux
  const setValue = (newValue: T) => {
    dispatch(action(newValue));
  };

  return [value, setValue];
};

