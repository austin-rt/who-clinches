import 'dotenv/config';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const REQUEST_TIMEOUT_MS = 60000;

export const fetchAPI = async <T = unknown>(
  endpoint: string,
  options: RequestInit & { method?: string } = {}
): Promise<T> => {
  let url = `${BASE_URL}${endpoint}`;

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
};

export const createOverride = (
  gameId: string,
  homeScore: number,
  awayScore: number
): [string, { homeScore: number; awayScore: number }] => {
  return [gameId, { homeScore, awayScore }];
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const validateFields = <T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: (keyof T)[] } => {
  const missingFields = requiredFields.filter((field) => !(field in obj));
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

export const validateNestedFields = (
  obj: Record<string, unknown>,
  requiredPaths: string[]
): { valid: boolean; missingPaths: string[]; errors: string[] } => {
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
};

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
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
};

beforeAll(() => {
  console.log('[Test Setup] ===== beforeAll() START =====');
  console.log('[Test Setup] ===== beforeAll() COMPLETE =====');
});

afterAll(() => {
  console.log('[Test Setup] ===== afterAll() START =====');
  console.log('[Test Setup] Restoring all mocks...');
  jest.restoreAllMocks();
  console.log('[Test Setup] Mocks restored');
  console.log('[Test Setup] ===== afterAll() COMPLETE =====');
});
