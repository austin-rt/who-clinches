/**
 * Jest Setup and Test Helpers
 *
 * Global test configuration, mocks, and utility functions.
 */

import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Fetch helper for API tests
 * Generic type T allows specifying expected response type
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit & { method?: string } = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Create test override scores for simulation
 */
export function createOverride(
  gameEspnId: string,
  homeScore: number,
  awayScore: number
): [string, { homeScore: number; awayScore: number }] {
  return [gameEspnId, { homeScore, awayScore }];
}

/**
 * Sleep helper for timing issues
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate required fields in an object
 */
export function validateFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: (keyof T)[] } {
  const missingFields = requiredFields.filter((field) => !(field in obj));
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

// Global test configuration
beforeAll(() => {
  // Suppress console output during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
