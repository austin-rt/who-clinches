'use client';

/**
 * Simple localStorage read/write utilities
 * No Redux coupling - just localStorage operations
 */

/**
 * Read a value from localStorage
 * @param key - localStorage key
 * @param defaultValue - Default value if not found or parse fails
 * @returns The stored value or defaultValue
 */
export const readLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(stored) as T;
    } catch {
      // If JSON parse fails, treat as string (for backward compatibility)
      return stored as unknown as T;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.)
    return defaultValue;
  }
};

/**
 * Write a value to localStorage
 * @param key - localStorage key
 * @param value - Value to store
 */
export const writeLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Always use JSON.stringify for consistency (handles strings, booleans, numbers, objects, etc.)
    const valueToStore = JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
  } catch {
    // localStorage unavailable - silently fail
  }
};
