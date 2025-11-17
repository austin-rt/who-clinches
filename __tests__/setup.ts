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

/**
 * Validate nested required fields using dot-notation paths
 * Example: ['espnId', 'venue.fullName', 'home.teamEspnId']
 */
export function validateNestedFields(
  obj: Record<string, unknown>,
  requiredPaths: string[]
): { valid: boolean; missingPaths: string[]; errors: string[] } {
  const missingPaths: string[] = [];
  const errors: string[] = [];

  for (const path of requiredPaths) {
    const value = getNestedValue(obj, path);
    if (value === undefined) {
      missingPaths.push(path);
      errors.push(`Missing required field: ${path}`);
    }
  }

  return {
    valid: missingPaths.length === 0,
    missingPaths,
    errors,
  };
}

/**
 * Get nested value from object using dot-notation path
 * Example: getNestedValue(obj, 'venue.fullName') => obj.venue.fullName
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
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
