/**
 * Jest Setup and Test Helpers
 *
 * Global test configuration, mocks, and utility functions.
 */

import 'dotenv/config';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Fetch helper for API tests
 * Generic type T allows specifying expected response type
 * Automatically adds bypass token for preview/production deployments
 * Includes 60-second timeout to prevent hanging requests
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit & { method?: string } = {}
): Promise<T> {
  let url = `${BASE_URL}${endpoint}`;

  // Add bypass token for preview/production deployments
  const isPreviewOrProduction = BASE_URL.includes('vercel.app');
  if (isPreviewOrProduction && VERCEL_AUTOMATION_BYPASS_SECRET) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('x-vercel-protection-bypass', VERCEL_AUTOMATION_BYPASS_SECRET);
    url = urlObj.toString();
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetchWithTimeout(
    url,
    {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    },
    REQUEST_TIMEOUT_MS
  );

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

afterAll(async () => {
  jest.restoreAllMocks();
  // Ensure all database connections are closed
  // This is a safety net - the global teardown will also handle cleanup
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic import needed for cleanup
    const mongoose = require('mongoose');
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic import needed for cleanup
    const { dbDisconnectTest } = require('../lib/mongodb-test');

    await dbDisconnectTest();

    // Close any remaining mongoose connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // Ignore errors if connection is already closed or already disconnected
  }
});
